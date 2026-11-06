<?php

namespace Database\Seeders;

use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\Role;
use Illuminate\Database\Seeder;

final class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            RoleCode::Customer->value => 'Customer',
            RoleCode::SuperAdmin->value => 'Super Administrator',
            RoleCode::CatalogManager->value => 'Catalog Manager',
        ] as $code => $name) {
            Role::query()->updateOrCreate(['code' => $code], ['name' => $name]);
        }
    }
}
