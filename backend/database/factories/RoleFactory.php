<?php

namespace Database\Factories;

use App\Domain\Identity\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Role> */
final class RoleFactory extends Factory
{
    protected $model = Role::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = fake()->unique()->jobTitle();

        return [
            'code' => Str::slug($name, '_').'_'.fake()->unique()->numberBetween(100, 999),
            'name' => $name,
        ];
    }
}
