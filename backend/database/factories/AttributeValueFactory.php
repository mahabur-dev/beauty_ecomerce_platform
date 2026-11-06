<?php

namespace Database\Factories;

use App\Domain\Catalog\Models\Attribute;
use App\Domain\Catalog\Models\AttributeValue;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<AttributeValue> */
final class AttributeValueFactory extends Factory
{
    protected $model = AttributeValue::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $value = fake()->unique()->word();

        return [
            'attribute_id' => Attribute::factory(),
            'value' => Str::title($value),
            'code' => Str::slug($value, '_'),
        ];
    }
}
