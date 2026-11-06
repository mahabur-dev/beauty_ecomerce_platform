<?php

namespace Tests\Feature\Database;

use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductImage;
use App\Domain\Catalog\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class DomainRelationshipTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_ownership_taxonomy_variants_and_images_are_explicitly_related(): void
    {
        $product = Product::factory()->create();
        $subcategory = Category::query()->findOrFail($product->primary_category_id);
        $variant = ProductVariant::factory()->for($product)->create();
        $image = ProductImage::factory()->for($product)->create([
            'product_variant_id' => $variant->getKey(),
        ]);

        $product->categories()->attach($subcategory);

        $loaded = Product::query()->with([
            'vendor',
            'brand',
            'primaryCategory.parent',
            'categories',
            'variants',
            'images.variant',
        ])->findOrFail($product->getKey());

        $this->assertSame($product->vendor_id, $loaded->vendor->getKey());
        $this->assertNotNull($loaded->brand);
        $this->assertSame($product->brand_id, $loaded->brand->getKey());
        $this->assertTrue($loaded->primaryCategory->is($subcategory));
        $this->assertNotNull($loaded->primaryCategory->parent);
        $this->assertTrue($loaded->categories->contains($subcategory));
        $this->assertTrue($loaded->variants->contains($variant));
        $this->assertTrue($loaded->images->contains($image));
        $loadedImage = $loaded->images->firstOrFail();
        $this->assertNotNull($loadedImage->variant);
        $this->assertTrue($loadedImage->variant->is($variant));
    }
}
