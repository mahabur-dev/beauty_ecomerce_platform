<?php

namespace Database\Seeders;

use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final class SuperAdminSeeder extends Seeder
{
    /**
     * Seed or update the initial Super Administrator.
     */
    public function run(): void
    {
        $role = Role::query()->firstOrCreate(
            ['code' => RoleCode::SuperAdmin->value],
            ['name' => 'Super Administrator']
        );
        $customerRole = Role::query()->firstOrCreate(
            ['code' => RoleCode::Customer->value],
            ['name' => 'Customer']
        );

        $email = mb_strtolower(trim((string) config('identity.super_admin.email')));
        $name = trim((string) config('identity.super_admin.name'));
        $password = (string) config('identity.super_admin.password');

        if ($email === '' || $name === '' || $password === '') {
            $this->command?->warn(
                'Super administrator seeding skipped. Use identity:provision-super-admin or configure all SUPER_ADMIN_* values.'
            );

            return;
        }

        DB::transaction(function () use ($email, $name, $password, $role, $customerRole): void {
            $user = User::query()->firstOrNew(['email' => $email]);
            $user->name = $name;
            $user->password = Hash::make($password);
            $user->email_verified_at = $user->email_verified_at ?? now();
            $user->vendor_id = null;
            $user->is_active = true;
            $user->save();

            $user->roles()->syncWithoutDetaching([
                $customerRole->getKey() => ['assigned_at' => now()],
                $role->getKey() => ['assigned_at' => now()],
            ]);
        });

        $this->command?->info("Super administrator [{$email}] successfully seeded/updated.");
    }
}
