<?php

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class RegisterCustomer
{
    public function execute(string $name, string $email, string $password): User
    {
        return DB::transaction(function () use ($name, $email, $password): User {
            $user = User::query()->create([
                'name' => trim($name),
                'email' => Str::lower(trim($email)),
                'password' => $password,
            ]);

            $role = Role::query()->where('code', RoleCode::Customer->value)->sole();
            $user->roles()->attach($role, ['assigned_at' => now()]);

            DB::afterCommit(static fn () => $user->sendEmailVerificationNotification());

            return $user;
        });
    }
}
