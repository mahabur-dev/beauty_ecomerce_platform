<?php

namespace App\Domain\Catalog\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Catalog\Exceptions\CatalogRuleException;
use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductVariant;
use App\Domain\Catalog\Services\ProductAccess;
use App\Domain\Identity\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final readonly class ManageProductVariants
{
    public function __construct(
        private ProductAccess $access,
        private AuditLogger $auditLogger,
    ) {}

    /** @param array<string, mixed> $payload */
    public function create(User $actor, Product $product, array $payload, ?string $ipAddress): ProductVariant
    {
        $this->access->authorize($actor, $product);

        return DB::transaction(function () use ($actor, $product, $payload, $ipAddress): ProductVariant {
            $product = Product::query()->whereKey($product->getKey())->lockForUpdate()->firstOrFail();
            $product->variants()->lockForUpdate()->get();
            $valueIds = $this->valueIds($payload);
            $this->assertUniqueCombination($product, $valueIds);
            $this->assertPrices($payload);

            if ((bool) ($payload['is_default'] ?? false)) {
                $product->variants()->update(['is_default' => false]);
            }

            $variant = new ProductVariant(Arr::except($payload, ['attribute_value_ids']));
            $variant->sku = $variant->sku ?: 'SKU-'.Str::upper(Str::random(12));
            $product->variants()->save($variant);
            $variant->attributeValues()->sync($valueIds);

            $this->auditLogger->record(
                $actor,
                'catalog.product_variant_created',
                'product_variant',
                (int) $variant->getKey(),
                after: $this->snapshot($variant, $valueIds),
                ipAddress: $ipAddress,
            );

            return $variant->load('attributeValues.attribute');
        });
    }

    /** @param array<string, mixed> $payload */
    public function update(
        User $actor,
        Product $product,
        ProductVariant $variant,
        array $payload,
        ?string $ipAddress,
    ): ProductVariant {
        $this->access->authorize($actor, $product);
        $this->assertOwned($product, $variant);

        return DB::transaction(function () use ($actor, $product, $variant, $payload, $ipAddress): ProductVariant {
            Product::query()->whereKey($product->getKey())->lockForUpdate()->firstOrFail();
            $variants = $product->variants()->lockForUpdate()->get();
            $variant = $variants->firstWhere('id', $variant->getKey());

            if (! $variant instanceof ProductVariant) {
                throw new CatalogRuleException('Variant not found for this product.', 404, 'Variant not found');
            }

            /** @var list<int> $beforeValueIds */
            $beforeValueIds = $variant->attributeValues()->pluck('attribute_values.id')
                ->map(fn ($id): int => (int) $id)->values()->all();
            $before = $this->snapshot($variant, $beforeValueIds);
            $valueIds = array_key_exists('attribute_value_ids', $payload)
                ? $this->valueIds($payload)
                : $beforeValueIds;
            $this->assertUniqueCombination($product, $valueIds, (int) $variant->getKey());
            $this->assertPrices([
                'price' => $payload['price'] ?? $variant->price,
                'compare_at_price' => array_key_exists('compare_at_price', $payload)
                    ? $payload['compare_at_price']
                    : $variant->compare_at_price,
            ]);

            if (array_key_exists('is_default', $payload)) {
                if (! (bool) $payload['is_default'] && $variant->is_default) {
                    throw new CatalogRuleException('Assign another default variant instead of unsetting the current default.');
                }

                if ((bool) $payload['is_default']) {
                    $product->variants()->whereKeyNot($variant->getKey())->update(['is_default' => false]);
                }
            }

            if (($payload['is_active'] ?? true) === false && $variant->is_default) {
                throw new CatalogRuleException('The default variant cannot be inactive.');
            }

            $variant->fill(Arr::except($payload, ['attribute_value_ids']))->save();
            $variant->attributeValues()->sync($valueIds);
            $this->auditLogger->record(
                $actor,
                'catalog.product_variant_updated',
                'product_variant',
                (int) $variant->getKey(),
                $before,
                $this->snapshot($variant, $valueIds),
                $ipAddress,
            );

            return $variant->refresh()->load('attributeValues.attribute');
        });
    }

    public function delete(
        User $actor,
        Product $product,
        ProductVariant $variant,
        ?string $ipAddress,
    ): void {
        $this->access->authorize($actor, $product);
        $this->assertOwned($product, $variant);

        DB::transaction(function () use ($actor, $product, $variant, $ipAddress): void {
            Product::query()->whereKey($product->getKey())->lockForUpdate()->firstOrFail();
            $variants = $product->variants()->lockForUpdate()->get();
            $variant = $variants->firstWhere('id', $variant->getKey());

            if (! $variant instanceof ProductVariant) {
                throw new CatalogRuleException('Variant not found for this product.', 404, 'Variant not found');
            }

            if ($variant->is_default || $variants->count() === 1) {
                throw new CatalogRuleException('The default or only variant cannot be deleted.', 409, 'Variant is required');
            }

            if ($variant->images()->exists()) {
                throw new CatalogRuleException('Delete variant images before deleting the variant.', 409, 'Variant is in use');
            }

            /** @var list<int> $valueIds */
            $valueIds = $variant->attributeValues()->pluck('attribute_values.id')
                ->map(fn ($id): int => (int) $id)->values()->all();
            $before = $this->snapshot($variant, $valueIds);
            $variant->delete();
            $this->auditLogger->record(
                $actor,
                'catalog.product_variant_deleted',
                'product_variant',
                (int) $variant->getKey(),
                $before,
                ipAddress: $ipAddress,
            );
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return list<int>
     */
    private function valueIds(array $payload): array
    {
        /** @var list<int> $valueIds */
        $valueIds = array_values(array_map('intval', $payload['attribute_value_ids'] ?? []));
        $values = DB::table('attribute_values')->whereIn('id', $valueIds)->get(['id', 'attribute_id']);

        if ($values->count() !== count(array_unique($valueIds))) {
            throw new CatalogRuleException('One or more attribute values are invalid.');
        }

        if ($values->pluck('attribute_id')->unique()->count() !== $values->count()) {
            throw new CatalogRuleException('A variant may use only one value from each attribute.');
        }

        sort($valueIds);

        return $valueIds;
    }

    /** @param list<int> $valueIds */
    private function assertUniqueCombination(Product $product, array $valueIds, ?int $exceptVariantId = null): void
    {
        $signature = implode(':', $valueIds);
        $variants = $product->variants()->with('attributeValues:id')->get();

        foreach ($variants as $existing) {
            if ($exceptVariantId === (int) $existing->getKey()) {
                continue;
            }

            $existingIds = $existing->attributeValues->modelKeys();
            sort($existingIds);

            if (implode(':', $existingIds) === $signature) {
                throw new CatalogRuleException('Variant attribute combinations must be unique.', 409, 'Duplicate variant');
            }
        }
    }

    private function assertOwned(Product $product, ProductVariant $variant): void
    {
        if ($variant->product_id !== $product->getKey()) {
            throw new CatalogRuleException('Variant not found for this product.', 404, 'Variant not found');
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

    /**
     * @param  list<int>  $valueIds
     * @return array<string, mixed>
     */
    private function snapshot(ProductVariant $variant, array $valueIds): array
    {
        return [
            ...$variant->only(['product_id', 'sku', 'barcode', 'title', 'price', 'compare_at_price', 'cost_price', 'is_default', 'is_active']),
            'attribute_value_ids' => $valueIds,
        ];
    }
}
