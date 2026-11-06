<?php

namespace Database\Factories;

use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<ProductVariant> */
final class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $price = fake()->randomFloat(2, 100, 5000);

        return [
            'product_id' => Product::factory(),
            'sku' => 'SKU-'.Str::upper(Str::random(12)),
            'barcode' => null,
            'title' => 'Default',
            'price' => $price,
            'compare_at_price' => $price + fake()->randomFloat(2, 1, 1000),
            'cost_price' => null,
            'is_default' => true,
            'is_active' => true,
        ];
    }
}
