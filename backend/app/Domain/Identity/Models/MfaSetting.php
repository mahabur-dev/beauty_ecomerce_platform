<?php

namespace App\Domain\Identity\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MfaSetting extends Model
{
    protected $table = 'user_mfa_settings';

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    /** @var list<string> */
    protected $fillable = ['secret'];

    /** @var list<string> */
    protected $hidden = ['secret'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'secret' => 'encrypted',
            'confirmed_at' => 'immutable_datetime',
            'last_used_at' => 'immutable_datetime',
            'recovery_codes_generated_at' => 'immutable_datetime',
        ];
    }
}
