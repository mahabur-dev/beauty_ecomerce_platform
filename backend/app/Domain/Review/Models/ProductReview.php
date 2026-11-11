<?php

namespace App\Domain\Review\Models;

use App\Domain\Catalog\Models\Product;
use App\Domain\Identity\Models\User;
use App\Domain\Review\Enums\ReviewMediaStatus;
use App\Domain\Review\Enums\ReviewStatus;
use App\Domain\Vendor\Models\Vendor;
use Carbon\CarbonImmutable;
use Database\Factories\ProductReviewFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $product_id
 * @property int $user_id
 * @property int $vendor_id
 * @property int $rating
 * @property string|null $title
 * @property string|null $body
 * @property ReviewStatus $status
 * @property bool $verified_purchase
 * @property CarbonImmutable|null $submitted_at
 * @property CarbonImmutable|null $published_at
 * @property int|null $moderated_by_user_id
 * @property CarbonImmutable|null $moderated_at
 * @property string|null $moderation_reason
 * @property int $lock_version
 * @property int|null $active_slot
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property CarbonImmutable|null $deleted_at
 */
final class ProductReview extends Model
{
    /** @use HasFactory<ProductReviewFactory> */
    use HasFactory, SoftDeletes;

    /** @var array<string, mixed> */
    protected $attributes = [
        'status' => 'pending',
        'verified_purchase' => false,
        'lock_version' => 1,
        'active_slot' => 1,
    ];

    /** @var list<string> */
    protected $fillable = [
        'rating',
        'title',
        'body',
    ];

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Vendor, $this> */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    /** @return BelongsTo<User, $this> */
    public function moderator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderated_by_user_id');
    }

    /** @return HasMany<ReviewMedia, $this> */
    public function media(): HasMany
    {
        return $this->hasMany(ReviewMedia::class, 'review_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    /** @return HasMany<ReviewMedia, $this> */
    public function readyMedia(): HasMany
    {
        return $this->media()
            ->where('status', ReviewMediaStatus::Ready->value);
    }

    /** @return HasOne<ReviewReply, $this> */
    public function reply(): HasOne
    {
        return $this->hasOne(ReviewReply::class, 'review_id');
    }

    /** @return HasMany<ReviewUploadIntent, $this> */
    public function uploadIntents(): HasMany
    {
        return $this->hasMany(ReviewUploadIntent::class, 'review_id');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'status' => ReviewStatus::class,
            'verified_purchase' => 'boolean',
            'submitted_at' => 'immutable_datetime',
            'published_at' => 'immutable_datetime',
            'moderated_at' => 'immutable_datetime',
            'lock_version' => 'integer',
            'active_slot' => 'integer',
            'deleted_at' => 'immutable_datetime',
        ];
    }
}
