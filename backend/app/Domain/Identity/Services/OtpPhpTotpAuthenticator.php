<?php

namespace App\Domain\Identity\Services;

use App\Domain\Identity\Contracts\TotpAuthenticator;
use InvalidArgumentException;
use OTPHP\InternalClock;
use OTPHP\TOTP;

final class OtpPhpTotpAuthenticator implements TotpAuthenticator
{
    public function generateSecret(): string
    {
        return TOTP::generate(new InternalClock)->getSecret();
    }

    public function provisioningUri(string $secret, string $email): string
    {
        if ($secret === '' || $email === '') {
            throw new InvalidArgumentException('TOTP secret and account name must not be empty.');
        }

        $issuer = trim((string) config('app.name')) ?: 'Beauty Commerce';

        return TOTP::createFromSecret($secret, new InternalClock)
            ->withLabel($email)
            ->withIssuer($issuer)
            ->getProvisioningUri();
    }

    public function verify(string $secret, string $code): bool
    {
        if ($secret === '' || $code === '') {
            return false;
        }

        $totp = TOTP::createFromSecret($secret, new InternalClock);
        $timestamp = time();

        foreach ([-30, 0, 30] as $offset) {
            if ($totp->verify($code, timestamp: max(0, $timestamp + $offset))) {
                return true;
            }
        }

        return false;
    }
}
