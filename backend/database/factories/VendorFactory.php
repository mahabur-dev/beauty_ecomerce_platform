<?php

namespace Database\Factories;

use App\Domain\Shared\Enums\RecordStatus;
use App\Domain\Vendor\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Vendor> */
final class VendorFactory extends Factory
{
    protected $model = Vendor::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1000, 9999),
            'status' => RecordStatus::Active,
        ];
    }
}
