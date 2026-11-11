<?php

namespace Tests\Feature\Identity;

use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Cookie;
use Tests\TestCase;

final class CrossOriginSessionCookieTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'Enterprise!Pass123';

    protected function setUp(): void
    {
        parent::setUp();

        Cache::clear();
        $this->seed(RoleSeeder::class);

        config([
            'session.same_site' => 'none',
            'session.secure' => true,
            'session.http_only' => true,
            'session.partitioned' => true,
            'sanctum.stateful' => ['beauty-ecomerce-platform.vercel.app'],
        ]);
    }

    public function test_stateful_api_routes_preserve_cross_origin_samesite_none_and_partitioned_session_cookies(): void
    {
        $admin = $this->makeUser(RoleCode::SuperAdmin);

        $headers = [
            'Origin' => 'https://beauty-ecomerce-platform.vercel.app',
            'Referer' => 'https://beauty-ecomerce-platform.vercel.app/',
            'Accept' => 'application/json',
        ];

        $csrfResponse = $this->withHeaders($headers)
            ->get('https://glowcare.alwaysdata.net/sanctum/csrf-cookie');

        $csrfResponse->assertNoContent();
        $this->assertSessionCookieAttributes($csrfResponse->headers->getCookies(), 'none', true, true);

        $loginResponse = $this->withHeaders($headers)
            ->postJson('https://glowcare.alwaysdata.net/api/v1/admin/auth/login', [
                'email' => $admin->email,
                'password' => self::PASSWORD,
            ]);

        $loginResponse->assertOk()->assertJsonPath('next', 'authenticated');
        $this->assertSessionCookieAttributes($loginResponse->headers->getCookies(), 'none', true, true);

        $sessionCookie = collect($loginResponse->headers->getCookies())
            ->first(static fn (Cookie $cookie): bool => $cookie->getName() === config('session.cookie'));
        self::assertInstanceOf(Cookie::class, $sessionCookie);

        $meResponse = $this->withHeaders($headers)
            ->withUnencryptedCookie((string) config('session.cookie'), (string) $sessionCookie->getValue())
            ->getJson('https://glowcare.alwaysdata.net/api/v1/admin/me');

        $meResponse->assertOk()
            ->assertJsonPath('data.email', $admin->email);
        $this->assertSessionCookieAttributes($meResponse->headers->getCookies(), 'none', true, true);
    }

    public function test_storefront_customer_login_preserves_cross_origin_session_cookies(): void
    {
        config([
            'sanctum.stateful' => ['beauty-ecomerce-platform-4jkf.vercel.app'],
        ]);

        $customer = $this->makeUser(RoleCode::Customer);
        $headers = [
            'Origin' => 'https://beauty-ecomerce-platform-4jkf.vercel.app',
            'Referer' => 'https://beauty-ecomerce-platform-4jkf.vercel.app/',
            'Accept' => 'application/json',
        ];

        $loginResponse = $this->withHeaders($headers)
            ->postJson('https://glowcare.alwaysdata.net/api/v1/auth/login', [
                'email' => $customer->email,
                'password' => self::PASSWORD,
            ]);

        $loginResponse->assertOk()
            ->assertJsonPath('data.email', $customer->email);
        $this->assertSessionCookieAttributes($loginResponse->headers->getCookies(), 'none', true, true);

        $sessionCookie = collect($loginResponse->headers->getCookies())
            ->first(static fn (Cookie $cookie): bool => $cookie->getName() === config('session.cookie'));
        self::assertInstanceOf(Cookie::class, $sessionCookie);

        $meResponse = $this->withHeaders($headers)
            ->withUnencryptedCookie((string) config('session.cookie'), (string) $sessionCookie->getValue())
            ->getJson('https://glowcare.alwaysdata.net/api/v1/auth/me');

        $meResponse->assertOk()
            ->assertJsonPath('data.email', $customer->email);
        $this->assertSessionCookieAttributes($meResponse->headers->getCookies(), 'none', true, true);
    }

    public function test_stateful_api_routes_still_respect_samesite_lax_when_configured(): void
    {
        config([
            'session.same_site' => 'lax',
            'session.secure' => false,
            'session.partitioned' => false,
            'sanctum.stateful' => ['localhost:3001'],
        ]);

        $admin = $this->makeUser(RoleCode::SuperAdmin);

        $loginResponse = $this->withHeaders([
            'Origin' => 'http://localhost:3001',
            'Referer' => 'http://localhost:3001/',
        ])->postJson('/api/v1/admin/auth/login', [
            'email' => $admin->email,
            'password' => self::PASSWORD,
        ]);

        $loginResponse->assertOk()->assertJsonPath('next', 'authenticated');
        $this->assertSessionCookieAttributes($loginResponse->headers->getCookies(), 'lax', false, false);
    }

    /**
     * @param  array<int, Cookie>  $cookies
     */
    private function assertSessionCookieAttributes(
        array $cookies,
        string $expectedSameSite,
        bool $expectedSecure,
        bool $expectedPartitioned,
    ): void {
        $sessionCookieName = (string) config('session.cookie');
        $matching = array_values(array_filter(
            $cookies,
            static fn (Cookie $cookie): bool => in_array($cookie->getName(), [$sessionCookieName, 'XSRF-TOKEN'], true),
        ));

        self::assertCount(2, $matching, 'Expected both session and XSRF-TOKEN cookies to be issued.');

        foreach ($matching as $cookie) {
            self::assertSame($expectedSameSite, $cookie->getSameSite());
            self::assertSame($expectedSecure, $cookie->isSecure());
            self::assertSame($expectedPartitioned, $cookie->isPartitioned());
        }
    }

    private function makeUser(RoleCode $roleCode): User
    {
        $user = User::factory()->create(['password' => self::PASSWORD]);
        $customerRole = Role::query()->where('code', RoleCode::Customer->value)->sole();
        $targetRole = Role::query()->where('code', $roleCode->value)->sole();

        $user->roles()->attach([
            $customerRole->getKey() => ['assigned_at' => now()],
            $targetRole->getKey() => ['assigned_at' => now()],
        ]);

        return $user;
    }
}
