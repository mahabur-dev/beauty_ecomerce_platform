<?php

namespace App\Domain\Catalog\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Catalog\Enums\ProductStatus;
use App\Domain\Catalog\Exceptions\CatalogRuleException;
use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductImage;
use App\Domain\Catalog\Models\ProductVariant;
use App\Domain\Catalog\Services\ProductAccess;
use App\Domain\Identity\Models\User;
use App\Domain\Media\Contracts\MediaStorage;
use App\Jobs\DeleteMediaAsset;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

final readonly class ManageProductImages
{
    public function __construct(
        private ProductAccess $access,
        private MediaStorage $storage,
        private AuditLogger $auditLogger,
    ) {}

    /** @param array{product_variant_id?: int|null, alt_text?: string|null, sort_order?: int, is_primary?: bool} $metadata */
    public function upload(
        User $actor,
        Product $product,
        UploadedFile $file,
        array $metadata,
        ?string $ipAddress,
    ): ProductImage {
        $this->access->authorize($actor, $product);
        $folder = (string) config('media.folder').'/products/'.$product->getKey();
        $asset = $this->storage->uploadImage($file, $folder);

        try {
            return DB::transaction(function () use ($actor, $product, $metadata, $asset, $ipAddress): ProductImage {
                $product = Product::query()->whereKey($product->getKey())->lockForUpdate()->firstOrFail();
                $images = $product->images()->lockForUpdate()->get();

                if ($images->count() >= 5) {
                    throw new CatalogRuleException('A product cannot have more than 5 images.');
                }

                $variantId = $metadata['product_variant_id'] ?? null;
                $this->assertVariant($product, $variantId);
                $isPrimary = (bool) ($metadata['is_primary'] ?? false) || $images->isEmpty();

                if ($isPrimary) {
                    $product->images()->update(['is_primary' => false]);
                }

                $image = new ProductImage([
                    'product_variant_id' => $variantId,
                    'storage_disk' => 'cloudinary',
                    'storage_path' => $asset->publicId,
                    'asset_id' => $asset->assetId,
                    'resource_type' => $asset->resourceType,
                    'delivery_type' => $asset->deliveryType,
                    'secure_url' => $asset->secureUrl,
                    'format' => $asset->format,
                    'bytes' => $asset->bytes,
                    'width' => $asset->width,
                    'height' => $asset->height,
                    'alt_text' => $metadata['alt_text'] ?? null,
                    'sort_order' => isset($metadata['sort_order']) ? (int) $metadata['sort_order'] : 0,
                    'is_primary' => $isPrimary,
                ]);
                $product->images()->save($image);
                $this->auditLogger->record(
                    $actor,
                    'catalog.product_image_uploaded',
                    'product_image',
                    (int) $image->getKey(),
                    after: $this->snapshot($image),
                    ipAddress: $ipAddress,
                );

                return $image->refresh()->load('variant');
            });
        } catch (Throwable $exception) {
            try {
                $this->storage->delete($asset->publicId, $asset->resourceType, $asset->deliveryType);
            } catch (Throwable $cleanupException) {
                Log::error('Cloudinary compensation delete failed.', [
                    'public_id' => $asset->publicId,
                    'exception' => $cleanupException,
                ]);
            }

            throw $exception;
        }
    }

    /** @param array{product_variant_id?: int|null, alt_text?: string|null, sort_order?: int, is_primary?: bool} $metadata */
    public function update(
        User $actor,
        Product $product,
        ProductImage $image,
        array $metadata,
        ?string $ipAddress,
    ): ProductImage {
        $this->access->authorize($actor, $product);
        $this->assertOwned($product, $image);

        return DB::transaction(function () use ($actor, $product, $image, $metadata, $ipAddress): ProductImage {
            Product::query()->whereKey($product->getKey())->lockForUpdate()->firstOrFail();
            $product->images()->lockForUpdate()->get();
            $image = ProductImage::query()->whereKey($image->getKey())->firstOrFail();
            $before = $this->snapshot($image);

            if (array_key_exists('product_variant_id', $metadata)) {
                $this->assertVariant($product, $metadata['product_variant_id']);
            }

            if (($metadata['is_primary'] ?? false) === true) {
                $product->images()->whereKeyNot($image->getKey())->update(['is_primary' => false]);
            } elseif (array_key_exists('is_primary', $metadata) && $image->is_primary) {
                throw new CatalogRuleException('Assign another primary image instead of unsetting the current primary.');
            }

            $image->fill($metadata)->save();
            $this->auditLogger->record(
                $actor,
                'catalog.product_image_updated',
                'product_image',
                (int) $image->getKey(),
                $before,
                $this->snapshot($image),
                $ipAddress,
            );

            return $image->refresh()->load('variant');
        });
    }

    public function delete(User $actor, Product $product, ProductImage $image, ?string $ipAddress): void
    {
        $this->access->authorize($actor, $product);
        $this->assertOwned($product, $image);

        DB::transaction(function () use ($actor, $product, $image, $ipAddress): void {
            $product = Product::query()->whereKey($product->getKey())->lockForUpdate()->firstOrFail();
            $images = $product->images()->lockForUpdate()->orderBy('sort_order')->orderBy('id')->get();
            $image = $images->firstWhere('id', $image->getKey());

            if (! $image instanceof ProductImage) {
                throw new CatalogRuleException('Image not found for this product.', 404, 'Image not found');
            }

            $replacement = $images->first(fn (ProductImage $candidate): bool => ! $candidate->is($image));

            if ($image->is_primary && $replacement === null
                && $product->getRawOriginal('status') === ProductStatus::Active->value) {
                throw new CatalogRuleException('A published product cannot lose its only primary image.', 409, 'Primary image required');
            }

            if ($image->is_primary && $replacement !== null) {
                $replacement->forceFill(['is_primary' => true])->save();
            }

            $before = $this->snapshot($image);
            $image->delete();
            $this->auditLogger->record(
                $actor,
                'catalog.product_image_deleted',
                'product_image',
                (int) $image->getKey(),
                $before,
                ipAddress: $ipAddress,
            );
            DeleteMediaAsset::dispatch($image->storage_path, $image->resource_type, $image->delivery_type);
        });
    }

    private function assertVariant(Product $product, mixed $variantId): void
    {
        if ($variantId !== null && ! ProductVariant::query()
            ->whereKey((int) $variantId)->where('product_id', $product->getKey())->exists()) {
            throw new CatalogRuleException('The image variant must belong to this product.');
        }
    }

    private function assertOwned(Product $product, ProductImage $image): void
    {
        if ($image->product_id !== $product->getKey()) {
            throw new CatalogRuleException('Image not found for this product.', 404, 'Image not found');
        }
    }

    /** @return array<string, mixed> */
    private function snapshot(ProductImage $image): array
    {
        return $image->only([
            'product_id', 'product_variant_id', 'storage_path', 'asset_id', 'resource_type',
            'delivery_type', 'secure_url', 'format', 'bytes', 'width', 'height', 'alt_text',
            'sort_order', 'is_primary',
        ]);
    }
}
