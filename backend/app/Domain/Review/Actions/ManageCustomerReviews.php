<?php

namespace App\Domain\Review\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Catalog\Queries\PublicProductQuery;
use App\Domain\Identity\Models\User;
use App\Domain\Review\Enums\ReviewStatus;
use App\Domain\Review\Enums\ReviewUploadIntentStatus;
use App\Domain\Review\Exceptions\ReviewRuleException;
use App\Domain\Review\Models\ProductReview;
use App\Domain\Review\Models\ReviewMedia;
use App\Domain\Review\Models\ReviewReply;
use App\Domain\Review\Models\ReviewUploadIntent;
use App\Jobs\DeleteMediaAsset;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

final readonly class ManageCustomerReviews
{
    public function __construct(
        private PublicProductQuery $products,
        private AuditLogger $auditLogger,
    ) {}

    /** @param array{rating: int, title?: string|null, body?: string|null} $payload */
    public function create(User $actor, string $productSlug, array $payload, ?string $ipAddress): ProductReview
    {
        $product = $this->products->visible()->where('slug', $productSlug)->firstOrFail();

        return DB::transaction(function () use ($actor, $product, $payload, $ipAddress): ProductReview {
            $duplicate = ProductReview::query()
                ->where('product_id', $product->getKey())
                ->where('user_id', $actor->getKey())
                ->where('active_slot', 1)
                ->exists();

            if ($duplicate) {
                throw new ReviewRuleException(
                    'You have already submitted an active review for this product.',
                    409,
                    'Duplicate review',
                );
            }

            $review = new ProductReview(Arr::only($payload, ['rating', 'title', 'body']));
            $review->forceFill([
                'product_id' => $product->getKey(),
                'user_id' => $actor->getKey(),
                'vendor_id' => $product->vendor_id,
                'status' => ReviewStatus::Pending->value,
                'verified_purchase' => false,
                'submitted_at' => now(),
                'published_at' => null,
                'lock_version' => 1,
                'active_slot' => 1,
            ]);

            try {
                $review->save();
            } catch (UniqueConstraintViolationException) {
                throw new ReviewRuleException(
                    'You have already submitted an active review for this product.',
                    409,
                    'Duplicate review',
                );
            }

            $this->auditLogger->record(
                $actor,
                'review.submitted',
                'product_review',
                (int) $review->getKey(),
                after: $this->snapshot($review),
                ipAddress: $ipAddress,
            );

            return $review->refresh()->load($this->relations());
        });
    }

    /** @param array{rating?: int, title?: string|null, body?: string|null, lock_version?: int} $payload */
    public function update(User $actor, ProductReview $review, array $payload, ?string $ipAddress): ProductReview
    {
        return DB::transaction(function () use ($actor, $review, $payload, $ipAddress): ProductReview {
            $locked = ProductReview::query()->whereKey($review->getKey())->lockForUpdate()->firstOrFail();

            if (array_key_exists('lock_version', $payload) && (int) $payload['lock_version'] !== (int) $locked->lock_version) {
                throw new ReviewRuleException(
                    'This review was modified concurrently. Refresh and try again.',
                    409,
                    'Version conflict',
                );
            }

            if ($locked->status === ReviewStatus::Hidden) {
                throw new ReviewRuleException(
                    'Hidden reviews cannot be edited; you may delete the review instead.',
                    409,
                    'Review locked',
                );
            }

            $before = $this->snapshot($locked);

            $locked->fill(Arr::only($payload, ['rating', 'title', 'body']));
            $locked->forceFill([
                'status' => ReviewStatus::Pending->value,
                'submitted_at' => now(),
                'published_at' => null,
                'moderated_by_user_id' => null,
                'moderated_at' => null,
                'moderation_reason' => null,
                'lock_version' => $locked->lock_version + 1,
            ]);
            $locked->save();

            $this->auditLogger->record(
                $actor,
                'review.updated',
                'product_review',
                (int) $locked->getKey(),
                $before,
                $this->snapshot($locked),
                $ipAddress,
            );

            return $locked->refresh()->load($this->relations());
        });
    }

    public function delete(User $actor, ProductReview $review, ?string $ipAddress): void
    {
        DB::transaction(function () use ($actor, $review, $ipAddress): void {
            $locked = ProductReview::query()->whereKey($review->getKey())->lockForUpdate()->firstOrFail();
            $before = $this->snapshot($locked);

            $mediaItems = $locked->media()->lockForUpdate()->get();
            foreach ($mediaItems as $media) {
                /** @var ReviewMedia $media */
                $media->forceFill(['video_slot' => null])->save();
                $media->delete();
                DeleteMediaAsset::dispatch($media->storage_path, $media->resource_type, $media->delivery_type);
            }

            ReviewUploadIntent::query()
                ->where('review_id', $locked->getKey())
                ->where('status', ReviewUploadIntentStatus::Pending->value)
                ->update(['status' => ReviewUploadIntentStatus::Cancelled->value]);

            ReviewReply::query()
                ->where('review_id', $locked->getKey())
                ->delete();

            $locked->forceFill([
                'active_slot' => null,
                'lock_version' => $locked->lock_version + 1,
            ])->save();
            $locked->delete();

            $this->auditLogger->record(
                $actor,
                'review.deleted',
                'product_review',
                (int) $locked->getKey(),
                $before,
                ['deleted_at' => $locked->deleted_at?->toISOString()],
                $ipAddress,
            );
        });
    }

    /** @return list<string> */
    private function relations(): array
    {
        return ['product:id,vendor_id,name,slug', 'user:id,name', 'readyMedia', 'reply.author:id,name'];
    }

    /** @return array<string, mixed> */
    private function snapshot(ProductReview $review): array
    {
        return $review->only([
            'product_id',
            'user_id',
            'vendor_id',
            'rating',
            'title',
            'body',
            'status',
            'published_at',
            'moderated_by_user_id',
            'moderation_reason',
            'lock_version',
        ]);
    }
}
