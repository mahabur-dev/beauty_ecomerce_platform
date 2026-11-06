<?php

namespace Tests\Feature\Identity;

use App\Domain\Identity\Contracts\TotpAuthenticator;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\AdminInvitation;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

final class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'Enterprise!Pass123';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->app->instance(TotpAuthenticator::class, new DeterministicTotpAuthenticator);
        Notification::fake();
        $this->withHeader('Origin', 'http://localhost:3000');
        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    public function test_customer_can_register_and_receives_only_customer_role(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Customer One',
            'email' => 'CUSTOMER@example.com',
            'password' => self::PASSWORD,
            'password_confirmation' => self::PASSWORD,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'customer@example.com')
            ->assertJsonPath('data.roles.0', RoleCode::Customer->value);

        $user = User::query()->where('email', 'customer@example.com')->sole();
        self::assertTrue($user->hasRole(RoleCode::Customer));
        self::assertFalse($user->isAdministrator());
        self::assertAuthenticatedAs($user);
    }

    public function test_admin_password_login_requires_mfa_before_privileged_session(): void
    {
        $admin = $this->makeAdministrator(RoleCode::SuperAdmin);

        $this->postJson('/api/v1/admin/auth/login', [
            'email' => $admin->email,
            'password' => self::PASSWORD,
        ])->assertAccepted()->assertJsonPath('next', 'mfa_setup');

        $this->getJson('/api/v1/admin/me')->assertUnauthorized();

        $this->getJson('/api/v1/admin/auth/mfa/setup')
            ->assertOk()
            ->assertJsonPath('secret', DeterministicTotpAuthenticator::SECRET);

        $confirmation = $this->postJson('/api/v1/admin/auth/mfa/confirm', ['code' => '123456']);
        $confirmation->assertOk()
            ->assertJsonCount(8, 'recovery_codes')
            ->assertJsonPath('user.mfa_enabled', true);

        $this->getJson('/api/v1/admin/me')
            ->assertOk()
            ->assertJsonPath('data.roles.1', RoleCode::SuperAdmin->value);
        self::assertAuthenticatedAs($admin);
        self::assertTrue($admin->refresh()->hasConfirmedMfa());
    }

    public function test_customer_can_login_read_profile_and_logout(): void
    {
        $customer = User::factory()->create(['password' => self::PASSWORD]);
        $role = Role::query()->where('code', RoleCode::Customer->value)->sole();
        $customer->roles()->attach($role, ['assigned_at' => now()]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $customer->email,
            'password' => self::PASSWORD,
        ])->assertOk()->assertJsonPath('data.id', $customer->getKey());

        $this->getJson('/api/v1/auth/me')->assertOk();
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_password_reset_rotates_credentials_and_returns_generic_forgot_response(): void
    {
        $user = User::factory()->create(['password' => self::PASSWORD]);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])
            ->assertAccepted();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'missing@example.com'])
            ->assertAccepted();

        $token = Password::createToken($user);
        $newPassword = 'Replacement!Pass456';
        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => $newPassword,
            'password_confirmation' => $newPassword,
        ])->assertOk();

        self::assertTrue(Hash::check($newPassword, $user->refresh()->password));
    }

    public function test_recovery_code_is_single_use(): void
    {
        $admin = $this->makeAdministrator(RoleCode::SuperAdmin);
        $this->postJson('/api/v1/admin/auth/login', ['email' => $admin->email, 'password' => self::PASSWORD]);
        $this->getJson('/api/v1/admin/auth/mfa/setup');
        $codes = $this->postJson('/api/v1/admin/auth/mfa/confirm', ['code' => '123456'])
            ->json('recovery_codes');
        self::assertIsArray($codes);
        $recoveryCode = (string) $codes[0];
        $this->postJson('/api/v1/admin/auth/logout')->assertNoContent();

        $this->postJson('/api/v1/admin/auth/login', ['email' => $admin->email, 'password' => self::PASSWORD])
            ->assertJsonPath('next', 'mfa_challenge');
        $this->postJson('/api/v1/admin/auth/mfa/challenge', ['recovery_code' => $recoveryCode])->assertOk();
        $this->postJson('/api/v1/admin/auth/logout')->assertNoContent();

        $this->postJson('/api/v1/admin/auth/login', ['email' => $admin->email, 'password' => self::PASSWORD]);
        $this->postJson('/api/v1/admin/auth/mfa/challenge', ['recovery_code' => $recoveryCode])
            ->assertUnprocessable()
            ->assertJsonPath('title', 'Identity rule violation');
    }

    public function test_expiring_invitation_is_hashed_single_use_and_requires_mfa_after_acceptance(): void
    {
        $inviter = $this->makeAdministrator(RoleCode::SuperAdmin);
        $role = Role::query()->where('code', RoleCode::SuperAdmin->value)->sole();
        $plainToken = str_repeat('a', 64);
        $invitation = new AdminInvitation([
            'email' => 'staff@example.com',
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addHour(),
        ]);
        $invitation->role()->associate($role);
        $invitation->inviter()->associate($inviter);
        $invitation->save();

        $payload = [
            'token' => $plainToken,
            'name' => 'Staff Member',
            'password' => self::PASSWORD,
            'password_confirmation' => self::PASSWORD,
        ];
        $this->postJson('/api/v1/admin/invitations/accept', $payload)
            ->assertOk()
            ->assertJsonPath('user.mfa_enabled', false);

        $staff = User::query()->where('email', 'staff@example.com')->sole();
        self::assertTrue($staff->hasRole(RoleCode::SuperAdmin));
        self::assertNull($staff->mfaSetting);
        $this->assertDatabaseMissing('admin_invitations', ['token_hash' => $plainToken]);

        $this->postJson('/api/v1/admin/invitations/accept', $payload)
            ->assertStatus(410)
            ->assertJsonPath('title', 'Invitation unavailable');
    }

    public function test_non_super_admin_cannot_invite_staff_even_with_valid_mfa_session(): void
    {
        $manager = $this->makeAdministrator(RoleCode::CatalogManager);
        $manager->mfaSetting()->create([
            'secret' => DeterministicTotpAuthenticator::SECRET,
        ])->forceFill(['confirmed_at' => now()])->save();

        $this->actingAs($manager)
            ->withSession([(string) config('identity.mfa_verified_session_key') => now()->timestamp])
            ->postJson('/api/v1/admin/invitations', [
                'email' => 'blocked@example.com',
                'role' => RoleCode::SuperAdmin->value,
            ])->assertForbidden();
    }

    private function makeAdministrator(RoleCode $roleCode): User
    {
        $user = User::factory()->create(['password' => self::PASSWORD]);
        $customerRole = Role::query()->where('code', RoleCode::Customer->value)->sole();
        $adminRole = Role::query()->where('code', $roleCode->value)->sole();
        $user->roles()->attach([
            $customerRole->getKey() => ['assigned_at' => now()],
            $adminRole->getKey() => ['assigned_at' => now()],
        ]);

        return $user;
    }
}

final class DeterministicTotpAuthenticator implements TotpAuthenticator
{
    public const SECRET = 'JBSWY3DPEHPK3PXP';

    public function generateSecret(): string
    {
        return self::SECRET;
    }

    public function provisioningUri(string $secret, string $accountName): string
    {
        return 'otpauth://totp/BeautyCommerce:'.rawurlencode($accountName).'?secret='.$secret;
    }

    public function verify(string $secret, string $code): bool
    {
        return $secret === self::SECRET && $code === '123456';
    }
}
