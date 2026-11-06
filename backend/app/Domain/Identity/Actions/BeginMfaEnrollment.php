<?php

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Contracts\TotpAuthenticator;
use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\MfaSetting;
use App\Domain\Identity\Models\User;

final readonly class BeginMfaEnrollment
{
    public function __construct(private TotpAuthenticator $totp) {}

    /** @return array{secret: string, provisioning_uri: string} */
    public function execute(User $user): array
    {
        if (! $user->isAdministrator()) {
            throw new IdentityRuleException('MFA enrollment is only available to administrative accounts.', 403, 'Forbidden');
        }

        $setting = MfaSetting::query()->where('user_id', $user->getKey())->first();

        if ($setting !== null) {
            if ($setting->confirmed_at !== null) {
                throw new IdentityRuleException('MFA is already enabled for this account.', 409, 'MFA already enabled');
            }

            $secret = $setting->secret;
        } else {
            $secret = $this->totp->generateSecret();
        }
        $user->mfaSetting()->updateOrCreate([], ['secret' => $secret]);

        return [
            'secret' => $secret,
            'provisioning_uri' => $this->totp->provisioningUri($secret, $user->email),
        ];
    }
}
