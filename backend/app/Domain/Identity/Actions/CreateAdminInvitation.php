<?php

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\AdminInvitation;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Notifications\StaffInvitationNotification;
use App\Domain\Vendor\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

final class CreateAdminInvitation
{
    public function execute(User $actor, string $email, RoleCode $roleCode, ?int $vendorId): AdminInvitation
    {
        if (! $roleCode->isAdministrative()) {
            throw new IdentityRuleException('Only administrative roles can be invited.');
        }

        $normalizedEmail = Str::lower(trim($email));
        $role = Role::query()->where('code', $roleCode->value)->sole();
        $vendor = $roleCode === RoleCode::CatalogManager
            ? Vendor::query()->whereKey($vendorId)->where('status', 'active')->first()
            : null;

        if ($roleCode === RoleCode::CatalogManager && $vendor === null) {
            throw new IdentityRuleException('An active vendor is required for a catalog manager.');
        }

        $plainToken = bin2hex(random_bytes(32));

        $invitation = DB::transaction(function () use ($actor, $normalizedEmail, $role, $vendor, $plainToken): AdminInvitation {
            AdminInvitation::query()
                ->where('email', $normalizedEmail)
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            $invitation = new AdminInvitation([
                'email' => $normalizedEmail,
                'token_hash' => hash('sha256', $plainToken),
                'expires_at' => now()->addHours((int) config('identity.invitation_ttl_hours')),
            ]);
            $invitation->role()->associate($role);
            $invitation->vendor()->associate($vendor);
            $invitation->inviter()->associate($actor);
            $invitation->save();

            DB::afterCommit(static function () use ($normalizedEmail, $plainToken, $role): void {
                Notification::route('mail', $normalizedEmail)
                    ->notify(new StaffInvitationNotification($plainToken, $role->name));
            });

            return $invitation;
        });

        return $invitation;
    }
}
