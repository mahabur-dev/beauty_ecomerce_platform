<?php

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Contracts\TotpAuthenticator;
use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\MfaSetting;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\RecoveryCodeService;
use Illuminate\Support\Facades\DB;

final readonly class ConfirmMfaEnrollment
{
    public function __construct(
        private TotpAuthenticator $totp,
        private RecoveryCodeService $recoveryCodes,
    ) {}

    /** @return list<string> */
    public function execute(User $user, string $code): array
    {
        return DB::transaction(function () use ($user, $code): array {
            /** @var MfaSetting|null $setting */
            $setting = $user->mfaSetting()->lockForUpdate()->first();

            if ($setting === null || $setting->confirmed_at !== null) {
                throw new IdentityRuleException('No pending MFA enrollment was found.', 409, 'MFA enrollment unavailable');
            }

            if (! $this->totp->verify($setting->secret, $code)) {
                throw new IdentityRuleException('The authentication code is invalid.');
            }

            $setting->forceFill(['confirmed_at' => now(), 'last_used_at' => now()])->save();

            return $this->recoveryCodes->replaceFor($user);
        });
    }
}
