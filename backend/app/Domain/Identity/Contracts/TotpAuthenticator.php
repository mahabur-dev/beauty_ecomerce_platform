<?php

namespace App\Domain\Identity\Contracts;

interface TotpAuthenticator
{
    public function generateSecret(): string;

    public function provisioningUri(string $secret, string $email): string;

    public function verify(string $secret, string $code): bool;
}
