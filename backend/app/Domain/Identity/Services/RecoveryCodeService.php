<?php

namespace App\Domain\Identity\Services;

use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\DB;

final class RecoveryCodeService
{
    /** @return list<string> */
    public function replaceFor(User $user): array
    {
        $plainCodes = [];

        DB::transaction(function () use ($user, &$plainCodes): void {
            $user->mfaRecoveryCodes()->delete();

            for ($index = 0; $index < 8; $index++) {
                $plainCode = strtoupper(bin2hex(random_bytes(8)));
                $plainCode = substr($plainCode, 0, 8).'-'.substr($plainCode, 8);
                $plainCodes[] = $plainCode;
                $user->mfaRecoveryCodes()->create(['code_hash' => $this->hash($plainCode)]);
            }

            $user->mfaSetting()->update(['recovery_codes_generated_at' => now()]);
        });

        return $plainCodes;
    }

    public function consume(User $user, string $plainCode): bool
    {
        return DB::transaction(function () use ($user, $plainCode): bool {
            $recoveryCode = $user->mfaRecoveryCodes()
                ->where('code_hash', $this->hash($plainCode))
                ->whereNull('used_at')
                ->lockForUpdate()
                ->first();

            if ($recoveryCode === null) {
                return false;
            }

            $recoveryCode->forceFill(['used_at' => now()])->save();

            return true;
        });
    }

    private function hash(string $plainCode): string
    {
        return hash_hmac(
            'sha256',
            strtoupper(str_replace(['-', ' '], '', $plainCode)),
            (string) config('app.key'),
        );
    }
}
