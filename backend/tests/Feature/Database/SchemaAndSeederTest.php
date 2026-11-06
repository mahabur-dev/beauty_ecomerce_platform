<?php

namespace Tests\Feature\Database;

use App\Domain\Catalog\Models\Brand;
use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductVariant;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Vendor\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class SchemaAndSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_phase_three_domain_tables_and_cloudinary_metadata_columns_exist(): void
    {
        foreach ([
            'vendors', 'users', 'roles', 'user_roles', 'categories', 'brands', 'products',
            'product_categories', 'product_variants', 'attributes', 'attribute_values',
            'variant_attribute_values', 'product_images', 'audit_logs',
        ] as $table) {
            $this->assertTrue(Schema::hasTable($table), "Expected table [{$table}] to exist.");
        }

        $this->assertTrue(Schema::hasColumns('product_images', [
            'storage_disk',
            'storage_path',
            'asset_id',
            'resource_type',
            'delivery_type',
            'secure_url',
            'format',
            'bytes',
            'width',
            'height',
        ]));
    }

    public function test_deterministic_seeders_are_idempotent_and_never_create_an_admin(): void
    {
        $this->seed();
        $this->seed();

        $this->assertSame(3, Role::query()->count());
        $this->assertSame(1, Vendor::query()->count());
        $this->assertSame(6, Category::query()->count());
        $this->assertSame(2, Brand::query()->count());
        $this->assertSame(6, Product::query()->count());
        $this->assertSame(6, ProductVariant::query()->count());
        $this->assertSame(0, User::query()->count());
        $this->assertSame(6, Product::query()->where('status', 'draft')->count());
    }
}
