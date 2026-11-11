<?php

namespace App\Domain\Catalog\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Catalog\Exceptions\CatalogRuleException;
use App\Domain\Catalog\Models\Category;
use App\Domain\Identity\Models\User;
use App\Domain\Media\Contracts\MediaStorage;
use App\Domain\Media\Data\UploadedAsset;
use App\Domain\Shared\Enums\RecordStatus;
use App\Jobs\DeleteMediaAsset;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

final readonly class ManageCategories
{
    public function __construct(
        private AuditLogger $auditLogger,
        private MediaStorage $storage,
    ) {}

    /** @param array{name: string, slug: string, description?: string|null, status?: string, sort_order?: int} $attributes */
    public function createRoot(
        User $actor,
        array $attributes,
        ?string $ipAddress,
        ?UploadedFile $image = null,
    ): Category {
        return DB::transaction(
            fn (): Category => $this->create($actor, null, $attributes, 'catalog.category_created', $ipAddress, $image),
        );
    }

    /** @param array{name: string, slug: string, description?: string|null, status?: string, sort_order?: int} $attributes */
    public function createChild(
        User $actor,
        int $parentId,
        array $attributes,
        ?string $ipAddress,
        ?UploadedFile $image = null,
    ): Category {
        return DB::transaction(function () use ($actor, $parentId, $attributes, $ipAddress, $image): Category {
            $parent = $this->activeRoot(
                Category::query()->whereKey($parentId)->lockForUpdate()->first(),
            );

            return $this->create($actor, $parent, $attributes, 'catalog.subcategory_created', $ipAddress, $image);
        });
    }

    /** @param array{name?: string, slug?: string, description?: string|null, status?: string, sort_order?: int} $attributes */
    public function updateRoot(
        User $actor,
        Category $category,
        array $attributes,
        ?string $ipAddress,
        ?UploadedFile $image = null,
        bool $removeImage = false,
    ): Category {
        return DB::transaction(function () use ($actor, $category, $attributes, $ipAddress, $image, $removeImage): Category {
            $category = $this->locked($category);
            $this->assertRoot($category);

            return $this->update($actor, $category, $attributes, 'catalog.category_updated', $ipAddress, $image, $removeImage);
        });
    }

    /** @param array{name?: string, slug?: string, description?: string|null, status?: string, sort_order?: int} $attributes */
    public function updateChild(
        User $actor,
        Category $category,
        ?int $parentId,
        array $attributes,
        ?string $ipAddress,
        ?UploadedFile $image = null,
        bool $removeImage = false,
    ): Category {
        return DB::transaction(function () use ($actor, $category, $parentId, $attributes, $ipAddress, $image, $removeImage): Category {
            $category = $this->locked($category);
            $this->assertChild($category);

            if ($parentId !== null && $parentId !== $category->parent_id) {
                if ($this->hasProducts($category)) {
                    throw new CatalogRuleException(
                        'A subcategory linked to products cannot be moved.',
                        409,
                        'Subcategory move blocked',
                    );
                }

                $parent = $this->activeRoot(
                    Category::query()->whereKey($parentId)->lockForUpdate()->first(),
                );
                $attributes['parent_id'] = $parent->getKey();
            } elseif (($attributes['status'] ?? null) === RecordStatus::Active->value) {
                $this->activeRoot(
                    Category::query()->whereKey($category->parent_id)->lockForUpdate()->first(),
                );
            }

            return $this->update($actor, $category, $attributes, 'catalog.subcategory_updated', $ipAddress, $image, $removeImage);
        });
    }

    public function uploadImage(
        User $actor,
        Category $category,
        UploadedFile $file,
        bool $root,
        ?string $ipAddress,
    ): Category {
        return DB::transaction(function () use ($actor, $category, $file, $root, $ipAddress): Category {
            $category = $this->locked($category);
            $root ? $this->assertRoot($category) : $this->assertChild($category);
            $subject = $root ? 'category' : 'subcategory';

            return $this->update(
                $actor,
                $category,
                [],
                "catalog.{$subject}_image_updated",
                $ipAddress,
                image: $file,
            );
        });
    }

    public function deleteImage(
        User $actor,
        Category $category,
        bool $root,
        ?string $ipAddress,
    ): Category {
        return DB::transaction(function () use ($actor, $category, $root, $ipAddress): Category {
            $category = $this->locked($category);
            $root ? $this->assertRoot($category) : $this->assertChild($category);

            if (! $category->hasImage()) {
                return $category;
            }

            $subject = $root ? 'category' : 'subcategory';

            return $this->update(
                $actor,
                $category,
                [],
                "catalog.{$subject}_image_deleted",
                $ipAddress,
                removeImage: true,
            );
        });
    }

    public function delete(User $actor, Category $category, ?string $ipAddress): void
    {
        DB::transaction(function () use ($actor, $category, $ipAddress): void {
            $category = $this->locked($category);

            if ($category->children()->whereNull('deleted_at')->exists()) {
                throw new CatalogRuleException(
                    'Delete or move active subcategories before deleting this category.',
                    409,
                    'Category is in use',
                );
            }

            if ($this->hasProducts($category)) {
                throw new CatalogRuleException(
                    'A category linked to products cannot be deleted.',
                    409,
                    'Category is in use',
                );
            }

            $before = $this->snapshot($category);
            $subject = $category->parent_id === null ? 'category' : 'subcategory';
            $category->delete();
            $this->auditLogger->record(
                $actor,
                "catalog.{$subject}_deleted",
                'category',
                (int) $category->getKey(),
                $before,
                ['deleted_at' => $category->deleted_at?->toISOString()],
                $ipAddress,
            );
        });
    }

    public function restore(User $actor, int $categoryId, bool $root, ?string $ipAddress): Category
    {
        return DB::transaction(function () use ($actor, $categoryId, $root, $ipAddress): Category {
            $category = Category::withTrashed()->whereKey($categoryId)->lockForUpdate()->firstOrFail();
            $root ? $this->assertRoot($category) : $this->assertChild($category);

            if (! $category->trashed()) {
                throw new CatalogRuleException('The category is not deleted.', 409, 'Category is already active');
            }

            if (! $root) {
                $this->activeRoot(
                    Category::query()->whereKey($category->parent_id)->lockForUpdate()->first(),
                );
            }

            $category->restore();
            $subject = $root ? 'category' : 'subcategory';
            $this->auditLogger->record(
                $actor,
                "catalog.{$subject}_restored",
                'category',
                (int) $category->getKey(),
                ['deleted_at' => true],
                $this->snapshot($category),
                $ipAddress,
            );

            return $category->refresh();
        });
    }

    /** @param array<string, mixed> $attributes */
    private function create(
        User $actor,
        ?Category $parent,
        array $attributes,
        string $action,
        ?string $ipAddress,
        ?UploadedFile $image = null,
    ): Category {
        $category = new Category($attributes);
        $category->parent()->associate($parent);
        $category->save();

        $uploadedAsset = null;

        if ($image !== null) {
            $uploadedAsset = $this->storage->uploadImage($image, $this->imageFolder($category));
            $this->applyUploadedAsset($category, $uploadedAsset);
        }

        try {
            if ($uploadedAsset !== null) {
                $category->save();
            }

            $this->auditLogger->record(
                $actor,
                $action,
                'category',
                (int) $category->getKey(),
                after: $this->snapshot($category),
                ipAddress: $ipAddress,
            );
        } catch (Throwable $exception) {
            if ($uploadedAsset !== null) {
                $this->compensateUpload($uploadedAsset);
            }

            throw $exception;
        }

        return $category->refresh();
    }

    /** @param array<string, mixed> $attributes */
    private function update(
        User $actor,
        Category $category,
        array $attributes,
        string $action,
        ?string $ipAddress,
        ?UploadedFile $image = null,
        bool $removeImage = false,
    ): Category {
        $before = $this->snapshot($category);
        $previousLocator = null;
        $uploadedAsset = null;

        if ($image !== null) {
            $previousLocator = $category->imageLocator();
            $uploadedAsset = $this->storage->uploadImage($image, $this->imageFolder($category));
            $this->applyUploadedAsset($category, $uploadedAsset);
        } elseif ($removeImage && $category->hasImage()) {
            $previousLocator = $category->imageLocator();
            $this->clearImageAttributes($category);
        }

        try {
            $category->fill($attributes)->save();
            $this->auditLogger->record(
                $actor,
                $action,
                'category',
                (int) $category->getKey(),
                $before,
                $this->snapshot($category),
                $ipAddress,
            );
        } catch (Throwable $exception) {
            if ($uploadedAsset !== null) {
                $this->compensateUpload($uploadedAsset);
            }

            throw $exception;
        }

        if ($previousLocator !== null) {
            DeleteMediaAsset::dispatch(
                $previousLocator['public_id'],
                $previousLocator['resource_type'],
                $previousLocator['delivery_type'],
            );
        }

        return $category->refresh();
    }

    private function imageFolder(Category $category): string
    {
        return trim((string) config('media.folder'), '/').'/categories/'.$category->getKey();
    }

    private function applyUploadedAsset(Category $category, UploadedAsset $asset): void
    {
        $category->forceFill([
            'image_storage_disk' => 'cloudinary',
            'image_storage_path' => $asset->publicId,
            'image_asset_id' => $asset->assetId,
            'image_resource_type' => $asset->resourceType,
            'image_delivery_type' => $asset->deliveryType,
            'image_url' => $asset->secureUrl,
            'image_format' => $asset->format,
            'image_bytes' => $asset->bytes,
            'image_width' => $asset->width,
            'image_height' => $asset->height,
        ]);
    }

    private function clearImageAttributes(Category $category): void
    {
        $category->forceFill([
            'image_storage_disk' => null,
            'image_storage_path' => null,
            'image_asset_id' => null,
            'image_resource_type' => null,
            'image_delivery_type' => null,
            'image_url' => null,
            'image_format' => null,
            'image_bytes' => null,
            'image_width' => null,
            'image_height' => null,
        ]);
    }

    private function compensateUpload(UploadedAsset $asset): void
    {
        try {
            $this->storage->delete($asset->publicId, $asset->resourceType, $asset->deliveryType);
        } catch (Throwable $cleanupException) {
            Log::error('Cloudinary category compensation delete failed.', [
                'public_id' => $asset->publicId,
                'exception' => $cleanupException,
            ]);
        }
    }

    private function locked(Category $category): Category
    {
        return Category::query()->whereKey($category->getKey())->lockForUpdate()->firstOrFail();
    }

    private function activeRoot(?Category $category): Category
    {
        if ($category === null || $category->parent_id !== null
            || $category->getRawOriginal('status') !== RecordStatus::Active->value) {
            throw new CatalogRuleException('The parent must be an active root category.');
        }

        return $category;
    }

    private function assertRoot(Category $category): void
    {
        if ($category->parent_id !== null) {
            throw new CatalogRuleException('The selected record is not a root category.', 404, 'Category not found');
        }
    }

    private function assertChild(Category $category): void
    {
        if ($category->parent_id === null) {
            throw new CatalogRuleException('The selected record is not a subcategory.', 404, 'Subcategory not found');
        }
    }

    private function hasProducts(Category $category): bool
    {
        return DB::table('product_categories')->where('category_id', $category->getKey())->exists()
            || DB::table('products')->where('primary_category_id', $category->getKey())->exists();
    }

    /** @return array<string, mixed> */
    private function snapshot(Category $category): array
    {
        return $category->only([
            'parent_id',
            'name',
            'slug',
            'description',
            'status',
            'sort_order',
            'image_storage_path',
            'image_asset_id',
            'image_url',
        ]);
    }
}
