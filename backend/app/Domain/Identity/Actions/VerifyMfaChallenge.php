<?php

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Contracts\TotpAuthenticator;
use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\RecoveryCodeService;

final readonly class VerifyMfaChallenge
{
    public function __construct(
        private TotpAuthenticator $totp,
        private RecoveryCodeService $recoveryCodes,
    ) {}

    public function execute(User $user, ?string $code, ?string $recoveryCode): void
    {
        $setting = $user->mfaSetting()->whereNotNull('confirmed_at')->first();

        if ($setting === null) {
            throw new IdentityRuleException('MFA enrollment is not complete.', 409, 'MFA enrollment required');
        }

        $verified = $code !== null
            ? $this->totp->verify($setting->secret, $code)
            : $recoveryCode !== null && $this->recoveryCodes->consume($user, $recoveryCode);

        if (! $verified) {
            throw new IdentityRuleException('The authentication code is invalid.');
        }

        $setting->forceFill(['last_used_at' => now()])->save();
    }
}
