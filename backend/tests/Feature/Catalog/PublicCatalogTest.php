<?php

namespace Tests\Feature\Catalog;

use App\Domain\Catalog\Enums\ProductStatus;
use App\Domain\Catalog\Models\Attribute as CatalogAttribute;
use App\Domain\Catalog\Models\AttributeValue;
use App\Domain\Catalog\Models\Brand;
use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductImage;
use App\Domain\Catalog\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class PublicCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_category_endpoints_expose_only_active_non_deleted_two_level_tree(): void
    {
        $root = Category::factory()->create(['name' => 'Skin Care', 'slug' => 'skin-care']);
        $active = Category::factory()->create(['parent_id' => $root->getKey(), 'name' => 'Serums', 'slug' => 'serums']);
        Category::factory()->create(['parent_id' => $root->getKey(), 'status' => 'inactive']);
        $deleted = Category::factory()->create(['parent_id' => $root->getKey()]);
        $deleted->delete();
        Category::factory()->create(['status' => 'inactive']);

        $this->getJson('/api/v1/categories')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonCount(1, 'data.0.subcategories')
            ->assertJsonPath('data.0.subcategories.0.slug', 'serums');
        $this->getJson('/api/v1/categories/skin-care')->assertOk();
        $this->getJson('/api/v1/categories/skin-care/subcategories')
            ->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/subcategories/serums')
            ->assertOk()->assertJsonPath('data.parent.slug', 'skin-care');

        $root->forceFill(['status' => 'inactive'])->save();
        $this->getJson('/api/v1/categories/skin-care')->assertNotFound();
        $this->getJson("/api/v1/subcategories/{$active->slug}")->assertNotFound();
    }

    public function test_public_product_listing_supports_search_taxonomy_brand_attribute_price_and_sort_filters(): void
    {
        [$root, $child] = $this->categoryPair('Makeup', 'makeup', 'Lipstick', 'lipstick');
        $brand = Brand::factory()->create(['name' => 'Aurora', 'slug' => 'aurora']);
        $attribute = CatalogAttribute::factory()->create(['code' => 'color', 'name' => 'Color']);
        $red = AttributeValue::factory()->create(['attribute_id' => $attribute->getKey(), 'code' => 'red', 'value' => 'Red']);
        $blue = AttributeValue::factory()->create(['attribute_id' => $attribute->getKey(), 'code' => 'blue', 'value' => 'Blue']);
        $redProduct = $this->publishProduct($child, 'Ruby Matte Lipstick', 'ruby-matte', 1200, $brand, [$red]);
        $this->publishProduct($child, 'Ocean Lipstick', 'ocean-lipstick', 1800, $brand, [$blue]);
        Product::factory()->create([
            'primary_category_id' => $child->getKey(),
            'name' => 'Hidden Draft',
            'slug' => 'hidden-draft',
            'status' => ProductStatus::Draft,
        ]);

        $url = '/api/v1/products?search=Ruby&category=makeup&subcategory=lipstick&brand=aurora'
            .'&attribute_value_ids='.$red->getKey().'&min_price=1000&max_price=1300&sort=price_asc';
        $this->getJson($url)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $redProduct->getKey())
            ->assertJsonPath('data.0.new_price', '1200.00')
            ->assertJsonPath('data.0.primary_image.is_primary', true);

        $this->getJson('/api/v1/products?sort=price_desc')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'ocean-lipstick')
            ->assertJsonMissing(['hidden-draft']);

        $this->getJson('/api/v1/products/ruby-matte')
            ->assertOk()
            ->assertJsonPath('data.variants.0.attribute_values.0.code', 'red')
            ->assertJsonMissingPath('data.variants.0.cost_price')
            ->assertJsonMissingPath('data.variants.0.barcode');

        $redProduct->delete();
        $this->getJson('/api/v1/products/ruby-matte')->assertNotFound();
        self::assertSame($root->getKey(), $child->parent_id);
    }

    public function test_grouped_catalog_is_paginated_capped_and_query_count_is_bounded(): void
    {
        $root = Category::factory()->create(['slug' => 'skin']);
        $firstGroup = null;

        for ($groupIndex = 0; $groupIndex < 11; $groupIndex++) {
            $subcategory = Category::factory()->create([
                'parent_id' => $root->getKey(),
                'sort_order' => $groupIndex,
            ]);
            $firstGroup ??= $subcategory;
            $productCount = $groupIndex === 0 ? 12 : 1;

            for ($productIndex = 0; $productIndex < $productCount; $productIndex++) {
                $this->publishProduct(
                    $subcategory,
                    "Product {$groupIndex}-{$productIndex}",
                    "product-{$groupIndex}-{$productIndex}",
                    100 + $productIndex,
                );
            }
        }

        Category::factory()->create(['parent_id' => $root->getKey(), 'sort_order' => 99]);
        DB::flushQueryLog();
        DB::enableQueryLog();
        $response = $this->getJson('/api/v1/catalog/grouped?category=skin');
        $queryCount = count(DB::getQueryLog());
        DB::disableQueryLog();

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonCount(10, 'data.0.products')
            ->assertJsonPath('meta.total', 11)
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.products_per_group', 10);
        self::assertLessThanOrEqual(12, $queryCount, 'Grouped catalog query count must remain bounded.');

        $this->getJson('/api/v1/catalog/grouped?category=skin&page=2')
            ->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/catalog/grouped?groups_per_page=21')
            ->assertUnprocessable()->assertJsonValidationErrors('groups_per_page');
        self::assertInstanceOf(Category::class, $firstGroup);
    }

    public function test_public_brand_and_facet_metadata_is_safe_and_bounded(): void
    {
        Brand::factory()->create(['name' => 'Visible Brand', 'slug' => 'visible-brand']);
        Brand::factory()->create(['name' => 'Hidden Brand', 'slug' => 'hidden-brand', 'status' => 'inactive']);
        $attribute = CatalogAttribute::factory()->create(['code' => 'finish', 'name' => 'Finish']);
        AttributeValue::factory()->create(['attribute_id' => $attribute->getKey(), 'code' => 'matte', 'value' => 'Matte']);

        $this->getJson('/api/v1/brands')
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'visible-brand');
        $this->getJson('/api/v1/brands/hidden-brand')->assertNotFound();
        $this->getJson('/api/v1/catalog/facets')
            ->assertOk()
            ->assertJsonPath('data.brands.0.slug', 'visible-brand')
            ->assertJsonPath('data.attributes.0.values.0.code', 'matte')
            ->assertJsonMissingPath('data.brands.0.status')
            ->assertJsonMissingPath('data.brands.0.created_at');
    }

    /** @return array{Category, Category} */
    private function categoryPair(string $rootName, string $rootSlug, string $childName, string $childSlug): array
    {
        $root = Category::factory()->create(['name' => $rootName, 'slug' => $rootSlug]);
        $child = Category::factory()->create([
            'parent_id' => $root->getKey(),
            'name' => $childName,
            'slug' => $childSlug,
        ]);

        return [$root, $child];
    }

    /** @param list<AttributeValue> $values */
    private function publishProduct(
        Category $subcategory,
        string $name,
        string $slug,
        int $price,
        ?Brand $brand = null,
        array $values = [],
    ): Product {
        $product = Product::factory()->create([
            'primary_category_id' => $subcategory->getKey(),
            'brand_id' => $brand?->getKey(),
            'name' => $name,
            'slug' => $slug,
            'status' => ProductStatus::Active,
        ]);
        $product->categories()->sync([$subcategory->getKey()]);
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->getKey(),
            'price' => $price,
            'compare_at_price' => $price + 200,
            'cost_price' => 50,
            'is_default' => true,
            'is_active' => true,
        ]);
        $variant->attributeValues()->sync(
            collect($values)->map(fn (AttributeValue $value) => $value->getKey())->all(),
        );
        ProductImage::factory()->create([
            'product_id' => $product->getKey(),
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        return $product;
    }
}
