<?php

namespace App\Domain\Identity\Models;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Notifications\ResetPasswordNotification;
use App\Domain\Review\Models\ProductReview;
use App\Domain\Vendor\Models\Vendor;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

final class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** @var list<string> */
    protected $fillable = ['name', 'email', 'password'];

    /** @var list<string> */
    protected $hidden = ['password', 'remember_token'];

    /** @return BelongsTo<Vendor, $this> */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    /** @return BelongsToMany<Role, $this> */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withPivot('assigned_at');
    }

    /** @return HasMany<AuditLog, $this> */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_user_id');
    }

    /** @return HasOne<MfaSetting, $this> */
    public function mfaSetting(): HasOne
    {
        return $this->hasOne(MfaSetting::class);
    }

    /** @return HasMany<MfaRecoveryCode, $this> */
    public function mfaRecoveryCodes(): HasMany
    {
        return $this->hasMany(MfaRecoveryCode::class);
    }

    /** @return HasMany<ProductReview, $this> */
    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    /** @return HasMany<ProductReview, $this> */
    public function moderatedReviews(): HasMany
    {
        return $this->hasMany(ProductReview::class, 'moderated_by_user_id');
    }

    public function hasRole(RoleCode|string $role): bool
    {
        $code = $role instanceof RoleCode ? $role->value : $role;

        return $this->roles()->where('code', $code)->exists();
    }

    public function isAdministrator(): bool
    {
        return $this->roles()
            ->whereIn('code', [RoleCode::SuperAdmin->value, RoleCode::CatalogManager->value])
            ->exists();
    }

    public function hasConfirmedMfa(): bool
    {
        return $this->mfaSetting()->whereNotNull('confirmed_at')->exists();
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification((string) $token));
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'immutable_datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }
}
