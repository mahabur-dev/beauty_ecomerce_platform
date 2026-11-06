<?php

namespace App\Domain\Identity\Models;

use App\Domain\Identity\Enums\RoleCode;
use Database\Factories\RoleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

final class Role extends Model
{
    /** @use HasFactory<RoleFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = ['code', 'name'];

    /** @return BelongsToMany<User, $this> */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles')
            ->withPivot('assigned_at');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['code' => RoleCode::class];
    }
}
