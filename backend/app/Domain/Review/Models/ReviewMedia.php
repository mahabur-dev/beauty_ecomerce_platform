<?php

namespace App\Domain\Review\Models;

use App\Domain\Review\Enums\ReviewMediaKind;
use App\Domain\Review\Enums\ReviewMediaStatus;
use Carbon\CarbonImmutable;
use Database\Factories\ReviewMediaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $review_id
 * @property ReviewMediaKind $kind
 * @property string $provider
 * @property string $storage_path
 * @property string $asset_id
 * @property string $resource_type
 * @property string $delivery_type
 * @property string $format
 * @property string $mime_type
 * @property int $bytes
 * @property int|null $width
 * @property int|null $height
 * @property float|null $duration_seconds
 * @property int $sort_order
 * @property ReviewMediaStatus $status
 * @property int|null $video_slot
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property CarbonImmutable|null $deleted_at
 */
final class ReviewMedia extends Model
{
    /** @use HasFactory<ReviewMediaFactory> */
    use HasFactory, SoftDeletes;

    /** @var array<string, mixed> */
    protected $attributes = [
        'provider' => 'cloudinary',
        'delivery_type' => 'authenticated',
        'sort_order' => 0,
        'status' => 'ready',
    ];

    /** @var list<string> */
    protected $fillable = [
        'sort_order',
    ];

    /** @return BelongsTo<ProductReview, $this> */
    public function review(): BelongsTo
    {
        return $this->belongsTo(ProductReview::class, 'review_id');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'kind' => ReviewMediaKind::class,
            'status' => ReviewMediaStatus::class,
            'bytes' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'duration_seconds' => 'float',
            'sort_order' => 'integer',
            'video_slot' => 'integer',
            'deleted_at' => 'immutable_datetime',
        ];
    }
}
