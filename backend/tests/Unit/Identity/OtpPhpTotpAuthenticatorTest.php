<?php

namespace Tests\Unit\Identity;

use App\Domain\Identity\Services\OtpPhpTotpAuthenticator;
use OTPHP\InternalClock;
use OTPHP\TOTP;
use Tests\TestCase;

final class OtpPhpTotpAuthenticatorTest extends TestCase
{
    public function test_it_generates_google_authenticator_compatible_totp_credentials(): void
    {
        $authenticator = new OtpPhpTotpAuthenticator;
        $secret = $authenticator->generateSecret();
        $uri = $authenticator->provisioningUri($secret, 'admin@example.com');
        $currentCode = TOTP::createFromSecret($secret, new InternalClock)->now();

        self::assertNotSame('', $secret);
        self::assertStringStartsWith('otpauth://totp/', $uri);
        self::assertStringContainsString('admin%40example.com', $uri);
        self::assertTrue($authenticator->verify($secret, $currentCode));
    }
}
