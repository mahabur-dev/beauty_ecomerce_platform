<?php

namespace App\Console\Commands;

use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

final class ProvisionSuperAdmin extends Command
{
    /** @var string */
    protected $signature = 'identity:provision-super-admin {--email=} {--name=} {--force : Allow execution in production}';

    /** @var string */
    protected $description = 'Securely create or promote the initial super administrator';

    public function handle(): int
    {
        if ($this->laravel->isProduction() && ! $this->option('force')) {
            $this->components->error('Use --force to explicitly provision an administrator in production.');

            return self::FAILURE;
        }

        $email = mb_strtolower(trim((string) ($this->option('email') ?: $this->ask('Email address'))));
        $name = trim((string) ($this->option('name') ?: $this->ask('Display name')));
        $existing = User::query()->where('email', $email)->first();
        $password = $existing === null ? (string) $this->secret('Password') : null;
        $confirmation = $existing === null ? (string) $this->secret('Confirm password') : null;

        $validator = Validator::make([
            'email' => $email,
            'name' => $name,
            'password' => $password,
            'password_confirmation' => $confirmation,
        ], [
            'email' => ['required', 'email:rfc', 'max:255'],
            'name' => ['required', 'string', 'max:160'],
            'password' => [$existing === null ? 'required' : 'nullable', 'confirmed', Password::defaults()],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->components->error($error);
            }

            return self::FAILURE;
        }

        $role = Role::query()->where('code', RoleCode::SuperAdmin->value)->first();
        $customerRole = Role::query()->where('code', RoleCode::Customer->value)->first();

        if ($role === null || $customerRole === null) {
            $this->components->error('Identity roles are missing. Run the database seeders first.');

            return self::FAILURE;
        }

        DB::transaction(function () use ($existing, $email, $name, $password, $role, $customerRole): void {
            $user = $existing ?? User::query()->create([
                'email' => $email,
                'name' => $name,
                'password' => (string) $password,
            ]);
            $user->forceFill([
                'name' => $name,
                'email_verified_at' => $user->email_verified_at ?? now(),
                'vendor_id' => null,
                'is_active' => true,
            ])->save();
            $user->roles()->syncWithoutDetaching([
                $customerRole->getKey() => ['assigned_at' => now()],
                $role->getKey() => ['assigned_at' => now()],
            ]);
        });

        $this->components->info('Super administrator provisioned. MFA enrollment is mandatory on first admin login.');

        return self::SUCCESS;
    }
}
