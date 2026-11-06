<?php

namespace Database\Factories;

use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductImage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<ProductImage> */
final class ProductImageFactory extends Factory
{
    protected $model = ProductImage::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $id = (string) Str::uuid();

        return [
            'product_id' => Product::factory(),
            'product_variant_id' => null,
            'storage_disk' => 'cloudinary',
            'storage_path' => 'tests/products/'.$id,
            'asset_id' => $id,
            'delivery_type' => 'upload',
            'format' => 'webp',
            'bytes' => fake()->numberBetween(10_000, 2_000_000),
            'width' => 1200,
            'height' => 1200,
            'alt_text' => fake()->sentence(4),
            'sort_order' => 0,
            'is_primary' => true,
        ];
    }
}
