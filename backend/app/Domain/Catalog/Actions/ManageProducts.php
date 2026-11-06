<?php

namespace App\Domain\Catalog\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Catalog\Enums\ProductStatus;
use App\Domain\Catalog\Exceptions\CatalogRuleException;
use App\Domain\Catalog\Models\Brand;
use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductVariant;
use App\Domain\Catalog\Services\ProductAccess;
use App\Domain\Identity\Models\User;
use App\Domain\Shared\Enums\RecordStatus;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final readonly class ManageProducts
{
    public function __construct(
        private ProductAccess $access,
        private AuditLogger $auditLogger,
    ) {}

    /** @param array<string, mixed> $payload */
    public function create(User $actor, array $payload, ?string $ipAddress): Product
    {
        return DB::transaction(function () use ($actor, $payload, $ipAddress): Product {
            $vendor = $this->access->vendorForCreation($actor);
            $subcategory = $this->subcategoryPair((int) $payload['category_id'], (int) $payload['subcategory_id']);
            $brand = $this->brand($payload['brand_id'] ?? null);
            /** @var list<array<string, mixed>> $variants */
            $variants = $payload['variants'];
            $this->assertExactlyOneDefault($variants);

            $product = new Product(Arr::except($payload, ['category_id', 'subcategory_id', 'variants', 'brand_id']));
            $product->vendor()->associate($vendor);
            $product->brand()->associate($brand);
            $product->primaryCategory()->associate($subcategory);
            $product->save();
            $product->categories()->sync([$subcategory->getKey()]);

            $signatures = [];
            foreach ($variants as $variantData) {
                $this->createVariant($product, $variantData, $signatures);
            }

            if ($product->getRawOriginal('status') === ProductStatus::Active->value) {
                throw new CatalogRuleException('Create the product as draft, upload a primary image, then publish it.');
            }

            $this->auditLogger->record(
                $actor,
                'catalog.product_created',
                'product',
                (int) $product->getKey(),
                after: $this->snapshot($product),
                ipAddress: $ipAddress,
            );

            return $product->load($this->relations());
        });
    }

    /** @param array<string, mixed> $payload */
    public function update(User $actor, Product $product, array $payload, ?string $ipAddress): Product
    {
        $this->access->authorize($actor, $product);

        return DB::transaction(function () use ($actor, $product, $payload, $ipAddress): Product {
            $product = Product::query()->whereKey($product->getKey())->lockForUpdate()->firstOrFail();
            $before = $this->snapshot($product);

            if (isset($payload['category_id'], $payload['subcategory_id'])) {
                $subcategory = $this->subcategoryPair((int) $payload['category_id'], (int) $payload['subcategory_id']);
                $product->primaryCategory()->associate($subcategory);
                $product->categories()->sync([$subcategory->getKey()]);
            }

            if (array_key_exists('brand_id', $payload)) {
                $product->brand()->associate($this->brand($payload['brand_id']));
            }

            if (array_key_exists('new_price', $payload) || array_key_exists('old_price', $payload)) {
                $defaultVariant = $product->variants()->where('is_default', true)->lockForUpdate()->first();

                if ($defaultVariant === null) {
                    throw new CatalogRuleException('The product has no default variant.');
                }

                $prices = [
                    'price' => $payload['new_price'] ?? $defaultVariant->price,
                    'compare_at_price' => array_key_exists('old_price', $payload)
                        ? $payload['old_price']
                        : $defaultVariant->compare_at_price,
                ];
                $this->assertPrices($prices);
                $defaultVariant->forceFill($prices)->save();
            }

            $product->fill(Arr::except($payload, [
                'category_id', 'subcategory_id', 'brand_id', 'new_price', 'old_price',
            ]))->save();

            if ($product->getRawOriginal('status') === ProductStatus::Active->value) {
                $this->assertPublishable($product);
            }

            $this->auditLogger->record(
                $actor,
                'catalog.product_updated',
                'product',
                (int) $product->getKey(),
                $before,
                $this->snapshot($product),
                $ipAddress,
            );

            return $product->refresh()->load($this->relations());
        });
    }

    public function delete(User $actor, Product $product, ?string $ipAddress): void
    {
        $this->access->authorize($actor, $product);

        DB::transaction(function () use ($actor, $product, $ipAddress): void {
            $product = Product::query()->whereKey($product->getKey())->lockForUpdate()->firstOrFail();
            $before = $this->snapshot($product);
            $product->delete();
            $this->auditLogger->record(
                $actor,
                'catalog.product_deleted',
                'product',
                (int) $product->getKey(),
                $before,
                ['deleted_at' => $product->deleted_at?->toISOString()],
                $ipAddress,
            );
        });
    }

    public function restore(User $actor, int $productId, ?string $ipAddress): Product
    {
        return DB::transaction(function () use ($actor, $productId, $ipAddress): Product {
            $product = Product::withTrashed()->whereKey($productId)->lockForUpdate()->firstOrFail();
            $this->access->authorize($actor, $product);

            if (! $product->trashed()) {
                throw new CatalogRuleException('The product is not deleted.', 409, 'Product is already active');
            }

            $product->restore();
            $this->auditLogger->record(
                $actor,
                'catalog.product_restored',
                'product',
                (int) $product->getKey(),
                ['deleted_at' => true],
                $this->snapshot($product),
                $ipAddress,
            );

            return $product->refresh()->load($this->relations());
        });
    }

    /** @param list<array<string, mixed>> $variants */
    private function assertExactlyOneDefault(array $variants): void
    {
        $defaults = collect($variants)->filter(fn (array $variant): bool => (bool) ($variant['is_default'] ?? false));

        if ($defaults->count() !== 1) {
            throw new CatalogRuleException('Exactly one variant must be marked as default.');
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, true>  $signatures
     */
    private function createVariant(Product $product, array $data, array &$signatures): ProductVariant
    {
        $this->assertPrices($data);
        /** @var list<int> $valueIds */
        $valueIds = array_map('intval', $data['attribute_value_ids'] ?? []);
        $signature = $this->attributeSignature($valueIds);

        if (isset($signatures[$signature])) {
            throw new CatalogRuleException('Variant attribute combinations must be unique.');
        }
        $signatures[$signature] = true;

        $variant = new ProductVariant(Arr::except($data, ['attribute_value_ids']));
        $variant->sku = $variant->sku ?: 'SKU-'.Str::upper(Str::random(12));
        $product->variants()->save($variant);
        $variant->attributeValues()->sync($valueIds);

        return $variant;
    }

    /** @param list<int> $valueIds */
    private function attributeSignature(array $valueIds): string
    {
        $values = DB::table('attribute_values')->whereIn('id', $valueIds)->get(['id', 'attribute_id']);

        if ($values->count() !== count(array_unique($valueIds))) {
            throw new CatalogRuleException('One or more attribute values are invalid.');
        }

        if ($values->pluck('attribute_id')->unique()->count() !== $values->count()) {
            throw new CatalogRuleException('A variant may use only one value from each attribute.');
        }

        sort($valueIds);

        return implode(':', $valueIds);
    }

    private function subcategoryPair(int $categoryId, int $subcategoryId): Category
    {
        $root = Category::query()->whereKey($categoryId)->whereNull('parent_id')
            ->where('status', RecordStatus::Active->value)->first();
        $child = Category::query()->whereKey($subcategoryId)->where('parent_id', $categoryId)
            ->where('status', RecordStatus::Active->value)->first();

        if ($root === null || $child === null) {
            throw new CatalogRuleException('Category and subcategory must be an active parent-child pair.');
        }

        return $child;
    }

    private function brand(mixed $brandId): ?Brand
    {
        if ($brandId === null) {
            return null;
        }

        $brand = Brand::query()->whereKey((int) $brandId)
            ->where('status', RecordStatus::Active->value)->first();

        if ($brand === null) {
            throw new CatalogRuleException('The selected brand must be active.');
        }

        return $brand;
    }

    private function assertPublishable(Product $product): void
    {
        $this->subcategoryPair(
            (int) Category::query()->whereKey($product->primary_category_id)->value('parent_id'),
            (int) $product->primary_category_id,
        );
        $variants = $product->variants()->lockForUpdate()->get();

        if ($variants->where('is_default', true)->count() !== 1
            || ! $variants->firstWhere('is_default', true)?->is_active) {
            throw new CatalogRuleException('A published product requires exactly one active default variant.');
        }

        if ($product->images()->lockForUpdate()->where('is_primary', true)->count() !== 1) {
            throw new CatalogRuleException('A published product requires exactly one primary image.');
        }
    }

    /** @param array<string, mixed> $data */
    private function assertPrices(array $data): void
    {
        $price = (float) $data['price'];
        $compareAt = $data['compare_at_price'] ?? null;

        if ($compareAt !== null && (float) $compareAt < $price) {
            throw new CatalogRuleException('Compare-at price must be greater than or equal to price.');
        }
    }

    /** @return list<string> */
    private function relations(): array
    {
        return ['vendor', 'brand', 'primaryCategory.parent', 'variants.attributeValues.attribute', 'images'];
    }

    /** @return array<string, mixed> */
    private function snapshot(Product $product): array
    {
        return $product->only([
            'vendor_id', 'brand_id', 'primary_category_id', 'name', 'slug', 'description',
            'short_description', 'status', 'meta_title', 'meta_description',
        ]);
    }
}
