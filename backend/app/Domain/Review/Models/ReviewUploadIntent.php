<?php

namespace App\Domain\Review\Models;

use App\Domain\Identity\Models\User;
use App\Domain\Review\Enums\ReviewMediaKind;
use App\Domain\Review\Enums\ReviewUploadIntentStatus;
use Carbon\CarbonImmutable;
use Database\Factories\ReviewUploadIntentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $token
 * @property int $review_id
 * @property int $user_id
 * @property string $provider
 * @property string $provider_asset_key
 * @property ReviewMediaKind $kind
 * @property ReviewUploadIntentStatus $status
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $finalized_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
final class ReviewUploadIntent extends Model
{
    /** @use HasFactory<ReviewUploadIntentFactory> */
    use HasFactory;

    /** @var array<string, mixed> */
    protected $attributes = [
        'provider' => 'cloudinary',
        'status' => 'pending',
    ];

    /** @var list<string> */
    protected $fillable = [];

    /** @return BelongsTo<ProductReview, $this> */
    public function review(): BelongsTo
    {
        return $this->belongsTo(ProductReview::class, 'review_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'kind' => ReviewMediaKind::class,
            'status' => ReviewUploadIntentStatus::class,
            'expires_at' => 'immutable_datetime',
            'finalized_at' => 'immutable_datetime',
        ];
    }
}
