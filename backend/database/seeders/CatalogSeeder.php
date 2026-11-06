<?php

namespace Database\Seeders;

use App\Domain\Catalog\Models\Attribute;
use App\Domain\Catalog\Models\Brand;
use App\Domain\Catalog\Models\Category;
use App\Domain\Shared\Enums\RecordStatus;
use Illuminate\Database\Seeder;

final class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $makeup = $this->category('makeup', 'Makeup', null, 10);
        $skincare = $this->category('skincare', 'Skincare', null, 20);

        $this->category('lipstick', 'Lipstick', $makeup->getKey(), 10);
        $this->category('face-makeup', 'Face Makeup', $makeup->getKey(), 20);
        $this->category('cleansers', 'Cleansers', $skincare->getKey(), 10);
        $this->category('moisturizers', 'Moisturizers', $skincare->getKey(), 20);

        foreach ([
            'aura-beauty' => 'Aura Beauty',
            'botanica-lab' => 'Botanica Lab',
        ] as $slug => $name) {
            Brand::query()->updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'status' => RecordStatus::Active],
            );
        }

        $shade = Attribute::query()->updateOrCreate(['code' => 'shade'], ['name' => 'Shade']);
        $size = Attribute::query()->updateOrCreate(['code' => 'size'], ['name' => 'Size']);

        foreach (['rose' => 'Rose', 'nude' => 'Nude', 'berry' => 'Berry'] as $code => $value) {
            $shade->values()->updateOrCreate(['code' => $code], ['value' => $value]);
        }

        foreach (['30ml' => '30 ml', '50ml' => '50 ml'] as $code => $value) {
            $size->values()->updateOrCreate(['code' => $code], ['value' => $value]);
        }
    }

    private function category(string $slug, string $name, int|string|null $parentId, int $sortOrder): Category
    {
        return Category::query()->updateOrCreate(
            ['slug' => $slug],
            [
                'parent_id' => $parentId,
                'name' => $name,
                'description' => null,
                'status' => RecordStatus::Active,
                'sort_order' => $sortOrder,
            ],
        );
    }
}
