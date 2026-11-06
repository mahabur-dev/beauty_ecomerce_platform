<?php

namespace App\Domain\Identity\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MfaRecoveryCode extends Model
{
    public const UPDATED_AT = null;

    /** @var list<string> */
    protected $fillable = ['code_hash'];

    /** @var list<string> */
    protected $hidden = ['code_hash'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['used_at' => 'immutable_datetime'];
    }
}
