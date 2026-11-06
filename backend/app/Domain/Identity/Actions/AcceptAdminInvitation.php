<?php

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\AdminInvitation;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final class AcceptAdminInvitation
{
    public function execute(string $token, ?string $name, ?string $password, ?string $currentPassword): User
    {
        return DB::transaction(function () use ($token, $name, $password, $currentPassword): User {
            $invitation = AdminInvitation::query()
                ->with(['role', 'vendor'])
                ->where('token_hash', hash('sha256', $token))
                ->lockForUpdate()
                ->first();

            if ($invitation === null || ! $invitation->isUsable()) {
                throw new IdentityRuleException('This invitation is invalid or expired.', 410, 'Invitation unavailable');
            }

            $user = User::query()->where('email', $invitation->email)->first();

            if ($user !== null) {
                if ($currentPassword === null || ! Hash::check($currentPassword, $user->password)) {
                    throw new IdentityRuleException('The existing account password is required.', 422, 'Password confirmation required');
                }

                if ($user->email_verified_at === null) {
                    throw new IdentityRuleException('The existing account email must be verified first.', 409, 'Email verification required');
                }
            } else {
                if ($name === null || trim($name) === '' || $password === null) {
                    throw new IdentityRuleException('Name and password are required for a new account.');
                }

                $user = User::query()->create([
                    'name' => trim($name),
                    'email' => $invitation->email,
                    'password' => $password,
                ]);
                $user->forceFill(['email_verified_at' => now()])->save();

                $customerRole = Role::query()->where('code', RoleCode::Customer->value)->sole();
                $user->roles()->attach($customerRole, ['assigned_at' => now()]);
            }

            $role = $invitation->role()->firstOrFail();
            $roleCode = RoleCode::from((string) $role->getRawOriginal('code'));
            $user->forceFill([
                'vendor_id' => $roleCode === RoleCode::CatalogManager ? $invitation->vendor_id : null,
                'is_active' => true,
            ])->save();
            $user->roles()->syncWithoutDetaching([$role->getKey() => ['assigned_at' => now()]]);
            $invitation->forceFill(['accepted_at' => now()])->save();

            return $user;
        });
    }
}
