<?php

namespace Database\Factories;

use App\Domain\Catalog\Models\Attribute;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Attribute> */
final class AttributeFactory extends Factory
{
    protected $model = Attribute::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'code' => Str::slug($name, '_').'_'.fake()->unique()->numberBetween(100, 999),
            'name' => Str::title($name),
        ];
    }
}
