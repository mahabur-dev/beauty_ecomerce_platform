<?php

namespace Database\Seeders;

use App\Domain\Catalog\Enums\ProductStatus;
use App\Domain\Catalog\Models\Brand;
use App\Domain\Catalog\Models\Category;
use App\Domain\Vendor\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use LogicException;

final class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $vendor = Vendor::query()->where('slug', 'platform-store')->sole();
        $brands = Brand::query()->whereIn('slug', ['aura-beauty', 'botanica-lab'])->get()->keyBy('slug');
        $categories = Category::query()
            ->whereIn('slug', ['lipstick', 'face-makeup', 'cleansers', 'moisturizers'])
            ->get()
            ->keyBy('slug');

        $products = [
            ['velvet-rose-lip-color', 'Velvet Rose Lip Color', 'lipstick', 'aura-beauty', 'BC-LIP-001', '890.00', '1090.00'],
            ['nude-satin-lip-color', 'Nude Satin Lip Color', 'lipstick', 'aura-beauty', 'BC-LIP-002', '850.00', '990.00'],
            ['soft-focus-foundation', 'Soft Focus Foundation', 'face-makeup', 'aura-beauty', 'BC-FACE-001', '1450.00', '1690.00'],
            ['gentle-gel-cleanser', 'Gentle Gel Cleanser', 'cleansers', 'botanica-lab', 'BC-SKIN-001', '720.00', '850.00'],
            ['daily-barrier-moisturizer', 'Daily Barrier Moisturizer', 'moisturizers', 'botanica-lab', 'BC-SKIN-002', '1180.00', '1350.00'],
            ['deep-hydration-cream', 'Deep Hydration Cream', 'moisturizers', 'botanica-lab', 'BC-SKIN-003', '1320.00', '1490.00'],
        ];

        foreach ($products as [$slug, $name, $categorySlug, $brandSlug, $sku, $price, $compareAtPrice]) {
            DB::transaction(function () use ($vendor, $brands, $categories, $slug, $name, $categorySlug, $brandSlug, $sku, $price, $compareAtPrice): void {
                $category = $categories->get($categorySlug);
                $brand = $brands->get($brandSlug);

                if ($category === null || $brand === null) {
                    throw new LogicException('Required deterministic catalog seed data is missing.');
                }
                $product = $vendor->products()->updateOrCreate(
                    ['slug' => $slug],
                    [
                        'brand_id' => $brand->getKey(),
                        'primary_category_id' => $category->getKey(),
                        'name' => $name,
                        'description' => $name.' is deterministic sample catalog data for local development.',
                        'short_description' => 'Sample beauty product for local development.',
                        'status' => ProductStatus::Draft,
                        'meta_title' => null,
                        'meta_description' => null,
                    ],
                );

                $product->categories()->sync([$category->getKey()]);
                $product->variants()->updateOrCreate(
                    ['sku' => $sku],
                    [
                        'barcode' => null,
                        'title' => 'Default',
                        'price' => $price,
                        'compare_at_price' => $compareAtPrice,
                        'cost_price' => null,
                        'is_default' => true,
                        'is_active' => true,
                    ],
                );
            });
        }
    }
}
