<?php

namespace App\Domain\Identity\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final readonly class ResetUserMfa
{
    public function __construct(private AuditLogger $auditLogger) {}

    public function execute(User $actor, User $target, string $actorPassword, ?string $ipAddress): void
    {
        if ($actor->is($target)) {
            throw new IdentityRuleException('Use recovery-code regeneration for your own account.', 409, 'Self-reset prohibited');
        }

        if (! Hash::check($actorPassword, $actor->password)) {
            throw new IdentityRuleException('Password confirmation failed.', 422, 'Password confirmation failed');
        }

        DB::transaction(function () use ($actor, $target, $ipAddress): void {
            $target->mfaSetting()->delete();
            $target->mfaRecoveryCodes()->delete();
            $target->tokens()->delete();
            DB::table('sessions')->where('user_id', $target->getKey())->delete();

            $this->auditLogger->record(
                actor: $actor,
                action: 'identity.mfa_reset',
                subjectType: 'user',
                subjectId: (int) $target->getKey(),
                ipAddress: $ipAddress,
            );
        });
    }
}
