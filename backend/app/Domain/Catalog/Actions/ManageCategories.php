<?php

namespace App\Domain\Catalog\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Catalog\Exceptions\CatalogRuleException;
use App\Domain\Catalog\Models\Category;
use App\Domain\Identity\Models\User;
use App\Domain\Shared\Enums\RecordStatus;
use Illuminate\Support\Facades\DB;

final readonly class ManageCategories
{
    public function __construct(private AuditLogger $auditLogger) {}

    /** @param array{name: string, slug: string, description?: string|null, status?: string, sort_order?: int} $attributes */
    public function createRoot(User $actor, array $attributes, ?string $ipAddress): Category
    {
        return DB::transaction(
            fn (): Category => $this->create($actor, null, $attributes, 'catalog.category_created', $ipAddress),
        );
    }

    /** @param array{name: string, slug: string, description?: string|null, status?: string, sort_order?: int} $attributes */
    public function createChild(User $actor, int $parentId, array $attributes, ?string $ipAddress): Category
    {
        return DB::transaction(function () use ($actor, $parentId, $attributes, $ipAddress): Category {
            $parent = $this->activeRoot(
                Category::query()->whereKey($parentId)->lockForUpdate()->first(),
            );

            return $this->create($actor, $parent, $attributes, 'catalog.subcategory_created', $ipAddress);
        });
    }

    /** @param array{name?: string, slug?: string, description?: string|null, status?: string, sort_order?: int} $attributes */
    public function updateRoot(User $actor, Category $category, array $attributes, ?string $ipAddress): Category
    {
        return DB::transaction(function () use ($actor, $category, $attributes, $ipAddress): Category {
            $category = $this->locked($category);
            $this->assertRoot($category);

            return $this->update($actor, $category, $attributes, 'catalog.category_updated', $ipAddress);
        });
    }

    /** @param array{name?: string, slug?: string, description?: string|null, status?: string, sort_order?: int} $attributes */
    public function updateChild(
        User $actor,
        Category $category,
        ?int $parentId,
        array $attributes,
        ?string $ipAddress,
    ): Category {
        return DB::transaction(function () use ($actor, $category, $parentId, $attributes, $ipAddress): Category {
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

            return $this->update($actor, $category, $attributes, 'catalog.subcategory_updated', $ipAddress);
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
    ): Category {
        $category = new Category($attributes);
        $category->parent()->associate($parent);
        $category->save();
        $this->auditLogger->record(
            $actor,
            $action,
            'category',
            (int) $category->getKey(),
            after: $this->snapshot($category),
            ipAddress: $ipAddress,
        );

        return $category;
    }

    /** @param array<string, mixed> $attributes */
    private function update(
        User $actor,
        Category $category,
        array $attributes,
        string $action,
        ?string $ipAddress,
    ): Category {
        $before = $this->snapshot($category);
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

        return $category->refresh();
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
        return $category->only(['parent_id', 'name', 'slug', 'description', 'status', 'sort_order']);
    }
}
