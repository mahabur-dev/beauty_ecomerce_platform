<?php

namespace App\Domain\Identity\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Vendor\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final readonly class SetAdministrativeRole
{
    public function __construct(private AuditLogger $auditLogger) {}

    public function execute(
        User $actor,
        User $target,
        RoleCode $newRole,
        ?int $vendorId,
        string $actorPassword,
        ?string $ipAddress,
    ): User {
        if (! Hash::check($actorPassword, $actor->password)) {
            throw new IdentityRuleException('Password confirmation failed.', 422, 'Password confirmation failed');
        }

        if (! $newRole->isAdministrative()) {
            throw new IdentityRuleException('An administrative role is required.');
        }

        if ($target->hasRole(RoleCode::SuperAdmin) && $newRole !== RoleCode::SuperAdmin) {
            $superAdminCount = User::query()
                ->where('is_active', true)
                ->whereHas('roles', fn ($query) => $query->where('code', RoleCode::SuperAdmin->value))
                ->count();

            if ($superAdminCount <= 1) {
                throw new IdentityRuleException('The last active super administrator cannot be demoted.', 409, 'Protected administrator');
            }
        }

        $vendor = $newRole === RoleCode::CatalogManager
            ? Vendor::query()->whereKey($vendorId)->where('status', 'active')->first()
            : null;

        if ($newRole === RoleCode::CatalogManager && $vendor === null) {
            throw new IdentityRuleException('An active vendor is required for a catalog manager.');
        }

        return DB::transaction(function () use ($actor, $target, $newRole, $vendor, $ipAddress): User {
            $target = User::query()->whereKey($target->getKey())->lockForUpdate()->firstOrFail();
            $before = ['roles' => $target->roles()->pluck('code')->all(), 'vendor_id' => $target->vendor_id];
            $customerRole = Role::query()->where('code', RoleCode::Customer->value)->sole();
            $adminRole = Role::query()->where('code', $newRole->value)->sole();

            $target->forceFill([
                'vendor_id' => $vendor?->getKey(),
                'is_active' => true,
            ])->save();
            $target->roles()->sync([
                $customerRole->getKey() => ['assigned_at' => now()],
                $adminRole->getKey() => ['assigned_at' => now()],
            ]);
            $target->tokens()->delete();
            DB::table('sessions')->where('user_id', $target->getKey())->delete();

            $this->auditLogger->record(
                actor: $actor,
                action: 'identity.administrative_role_changed',
                subjectType: 'user',
                subjectId: (int) $target->getKey(),
                before: $before,
                after: ['roles' => [RoleCode::Customer->value, $newRole->value], 'vendor_id' => $target->vendor_id],
                ipAddress: $ipAddress,
            );

            return $target->refresh();
        });
    }
}
