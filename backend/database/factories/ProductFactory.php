<?php

namespace Database\Factories;

use App\Domain\Catalog\Enums\ProductStatus;
use App\Domain\Catalog\Models\Brand;
use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Product;
use App\Domain\Vendor\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Product> */
final class ProductFactory extends Factory
{
    protected $model = Product::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $words = fake()->unique()->words(3);
        $name = is_array($words) ? implode(' ', $words) : $words;

        return [
            'vendor_id' => Vendor::factory(),
            'brand_id' => Brand::factory(),
            'primary_category_id' => Category::factory()->subcategory(),
            'name' => Str::title($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1000, 9999),
            'description' => fake()->paragraphs(2, true),
            'short_description' => fake()->sentence(),
            'status' => ProductStatus::Draft,
            'meta_title' => null,
            'meta_description' => null,
        ];
    }
}
