<?php

namespace Database\Factories;

use App\Domain\Catalog\Models\Category;
use App\Domain\Shared\Enums\RecordStatus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Category> */
final class CategoryFactory extends Factory
{
    protected $model = Category::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $words = fake()->unique()->words(2);
        $name = is_array($words) ? implode(' ', $words) : $words;

        return [
            'parent_id' => null,
            'name' => Str::title($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1000, 9999),
            'description' => fake()->sentence(),
            'status' => RecordStatus::Active,
            'sort_order' => 0,
        ];
    }

    public function subcategory(): static
    {
        return $this->state(fn (): array => [
            'parent_id' => Category::factory(),
        ]);
    }
}
