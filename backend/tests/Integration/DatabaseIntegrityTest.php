<?php

namespace Tests\Integration;

use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Product;
use App\Domain\Vendor\Models\Vendor;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class DatabaseIntegrityTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_rejects_a_missing_vendor(): void
    {
        $product = Product::factory()->make();

        $this->expectException(QueryException::class);

        DB::table('products')->insert([
            ...$product->getAttributes(),
            'vendor_id' => 999_999,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_parent_category_cannot_be_hard_deleted_while_a_child_exists(): void
    {
        $parent = Category::factory()->create();
        Category::factory()->create(['parent_id' => $parent->getKey()]);

        $this->expectException(QueryException::class);

        $parent->forceDelete();
    }

    public function test_vendor_cannot_be_hard_deleted_while_a_product_exists(): void
    {
        $vendor = Vendor::factory()->create();
        Product::factory()->create(['vendor_id' => $vendor->getKey()]);

        $this->expectException(QueryException::class);

        $vendor->forceDelete();
    }

    public function test_mysql_rejects_negative_and_inverted_variant_prices(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            $this->markTestSkipped('MySQL CHECK constraints are verified in the isolated integration database.');
        }

        $product = Product::factory()->create();

        foreach ([
            ['price' => '-1.00', 'compare_at_price' => null],
            ['price' => '100.00', 'compare_at_price' => '99.99'],
        ] as $prices) {
            try {
                DB::table('product_variants')->insert([
                    'product_id' => $product->getKey(),
                    'sku' => fake()->unique()->numerify('CHECK-########'),
                    'title' => 'Invalid price',
                    ...$prices,
                    'is_default' => false,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $this->fail('MySQL accepted an invalid variant price.');
            } catch (QueryException) {
                $this->addToAssertionCount(1);
            }
        }
    }
}
