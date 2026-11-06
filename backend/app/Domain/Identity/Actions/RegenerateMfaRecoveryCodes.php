<?php

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Contracts\TotpAuthenticator;
use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\RecoveryCodeService;
use Illuminate\Support\Facades\Hash;

final readonly class RegenerateMfaRecoveryCodes
{
    public function __construct(
        private TotpAuthenticator $totp,
        private RecoveryCodeService $recoveryCodes,
    ) {}

    /** @return list<string> */
    public function execute(User $user, string $password, string $code): array
    {
        $setting = $user->mfaSetting()->whereNotNull('confirmed_at')->first();

        if ($setting === null || ! Hash::check($password, $user->password)
            || ! $this->totp->verify($setting->secret, $code)) {
            throw new IdentityRuleException('Password or authentication code is invalid.');
        }

        return $this->recoveryCodes->replaceFor($user);
    }
}
