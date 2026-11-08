<?php

namespace App\Domain\Catalog\Queries;

use App\Domain\Catalog\Enums\ProductStatus;
use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductVariant;
use App\Domain\Shared\Enums\RecordStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final class PublicProductQuery
{
    /** @return Builder<Product> */
    public function visible(): Builder
    {
        return $this->applyVisibility(Product::query());
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function applyVisibility(Builder $query): Builder
    {
        return $query->where('products.status', ProductStatus::Active->value)
            ->whereHas('primaryCategory', fn (Builder $query) => $query
                ->where('status', RecordStatus::Active->value)
                ->whereHas('parent', fn (Builder $parent) => $parent->where('status', RecordStatus::Active->value)))
            ->whereHas('variants', fn (Builder $query) => $query
                ->where('is_default', true)
                ->where('is_active', true))
            ->whereHas('images', fn (Builder $query) => $query->where('is_primary', true))
            ->where(fn (Builder $query) => $query
                ->whereNull('brand_id')
                ->orWhereHas('brand', fn (Builder $brand) => $brand->where('status', RecordStatus::Active->value)));
    }

    /**
     * @param  array{search?: string|null, category?: string|null, subcategory?: string|null, subcategories?: list<string>, brand?: string|null, brands?: list<string>, attribute_value_ids?: list<int>, min_price?: numeric-string|null, max_price?: numeric-string|null, sort?: string|null}  $filters
     * @return Builder<Product>
     */
    public function filtered(array $filters): Builder
    {
        $query = $this->visible();

        if (($filters['search'] ?? null) !== null) {
            $search = (string) $filters['search'];
            $query->where(fn (Builder $builder) => $builder
                ->where('name', 'like', "%{$search}%")
                ->orWhere('short_description', 'like', "%{$search}%")
                ->orWhereHas('brand', fn (Builder $brand) => $brand->where('name', 'like', "%{$search}%")));
        }
        if (($filters['category'] ?? null) !== null) {
            $slug = (string) $filters['category'];
            $query->whereHas('primaryCategory.parent', fn (Builder $parent) => $parent->where('slug', $slug));
        }

        $subcategories = $filters['subcategories'] ?? (isset($filters['subcategory']) && $filters['subcategory'] !== null && $filters['subcategory'] !== '' ? [$filters['subcategory']] : []);
        if ($subcategories !== []) {
            $query->whereHas('primaryCategory', fn (Builder $category) => $category->whereIn('slug', $subcategories));
        }

        $brands = $filters['brands'] ?? (isset($filters['brand']) && $filters['brand'] !== null && $filters['brand'] !== '' ? [$filters['brand']] : []);
        if ($brands !== []) {
            $query->whereHas('brand', fn (Builder $brand) => $brand->whereIn('slug', $brands));
        }

        $valueIds = $filters['attribute_value_ids'] ?? [];
        if ($valueIds !== []) {
            $groups = DB::table('attribute_values')->whereIn('id', $valueIds)
                ->get(['id', 'attribute_id'])->groupBy('attribute_id');

            foreach ($groups as $values) {
                $ids = $values->pluck('id')->map(fn ($id): int => (int) $id)->all();
                $query->whereHas('variants', fn (Builder $variant) => $variant
                    ->where('is_active', true)
                    ->whereHas('attributeValues', fn (Builder $value) => $value->whereIn('attribute_values.id', $ids)));
            }
        }

        if (($filters['min_price'] ?? null) !== null) {
            $query->whereHas('variants', fn (Builder $variant) => $variant
                ->where('is_default', true)->where('price', '>=', (string) $filters['min_price']));
        }
        if (($filters['max_price'] ?? null) !== null) {
            $query->whereHas('variants', fn (Builder $variant) => $variant
                ->where('is_default', true)->where('price', '<=', (string) $filters['max_price']));
        }

        $defaultPrice = ProductVariant::query()
            ->select('price')
            ->whereColumn('product_id', 'products.id')
            ->where('is_default', true)
            ->limit(1);

        return match ($filters['sort'] ?? 'newest') {
            'price_asc' => $query->orderBy($defaultPrice)->orderBy('products.id'),
            'price_desc' => $query->orderByDesc($defaultPrice)->orderByDesc('products.id'),
            'name' => $query->orderBy('products.name')->orderBy('products.id'),
            default => $query->latest('products.id'),
        };
    }

    /** @return array<int|string, mixed> */
    public function summaryRelations(): array
    {
        return [
            'brand:id,name,slug',
            'primaryCategory:id,parent_id,name,slug',
            'primaryCategory.parent:id,parent_id,name,slug',
            'variants' => fn ($query) => $query->where('is_default', true)->where('is_active', true),
            'images' => fn ($query) => $query->where('is_primary', true)->orderBy('id'),
        ];
    }

    /** @return array<int|string, mixed> */
    public function detailRelations(): array
    {
        return [
            'brand:id,name,slug',
            'primaryCategory:id,parent_id,name,slug',
            'primaryCategory.parent:id,parent_id,name,slug',
            'variants' => fn ($query) => $query->where('is_active', true)->orderByDesc('is_default')->orderBy('id'),
            'variants.attributeValues.attribute',
            'images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order')->orderBy('id'),
        ];
    }
}
