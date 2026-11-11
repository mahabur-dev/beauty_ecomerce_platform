<?php

namespace App\Domain\Review\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Identity\Models\User;
use App\Domain\Review\Contracts\ReviewMediaStorage;
use App\Domain\Review\Data\SignedReviewUpload;
use App\Domain\Review\Data\VerifiedReviewAsset;
use App\Domain\Review\Enums\ReviewMediaKind;
use App\Domain\Review\Enums\ReviewMediaStatus;
use App\Domain\Review\Enums\ReviewStatus;
use App\Domain\Review\Enums\ReviewUploadIntentStatus;
use App\Domain\Review\Exceptions\ReviewRuleException;
use App\Domain\Review\Models\ProductReview;
use App\Domain\Review\Models\ReviewMedia;
use App\Domain\Review\Models\ReviewUploadIntent;
use App\Jobs\DeleteMediaAsset;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

final readonly class ManageReviewMedia
{
    public function __construct(
        private ReviewMediaStorage $storage,
        private AuditLogger $auditLogger,
    ) {}

    /**
     * @param  array{kind: string, format: string, mime_type: string, bytes: int, duration_seconds?: float|int|null}  $payload
     * @return array{intent: ReviewUploadIntent, upload: SignedReviewUpload}
     */
    public function createIntent(User $actor, ProductReview $review, array $payload, ?string $ipAddress): array
    {
        $kind = ReviewMediaKind::from((string) $payload['kind']);
        $this->assertKindEnabled($kind);
        $this->assertClientConstraints(
            $kind,
            strtolower((string) $payload['format']),
            strtolower((string) $payload['mime_type']),
            (int) $payload['bytes'],
            isset($payload['duration_seconds']) ? (float) $payload['duration_seconds'] : null,
        );

        return DB::transaction(function () use ($actor, $review, $kind, $ipAddress): array {
            $lockedReview = ProductReview::query()->whereKey($review->getKey())->lockForUpdate()->firstOrFail();

            if ($lockedReview->status === ReviewStatus::Hidden) {
                throw new ReviewRuleException(
                    'Media cannot be added to a hidden review.',
                    409,
                    'Review locked',
                );
            }

            // Expire outdated pending intents so stale attempts never block legitimate retries.
            ReviewUploadIntent::query()
                ->where('review_id', $lockedReview->getKey())
                ->where('status', ReviewUploadIntentStatus::Pending->value)
                ->where('expires_at', '<=', now())
                ->update(['status' => ReviewUploadIntentStatus::Expired->value]);

            $this->assertMediaSlotAvailable($lockedReview, $kind, includePendingIntents: true);

            $ttlMinutes = max(1, (int) config('reviews.upload_intent_ttl_minutes', 10));
            $folder = trim((string) config('media.folder', 'beauty-commerce/local'), '/');
            $token = (string) Str::uuid();

            $intent = new ReviewUploadIntent;
            $intent->forceFill([
                'token' => $token,
                'review_id' => $lockedReview->getKey(),
                'user_id' => $actor->getKey(),
                'provider' => 'cloudinary',
                'provider_asset_key' => "{$folder}/reviews/{$lockedReview->getKey()}/".Str::uuid(),
                'kind' => $kind->value,
                'status' => ReviewUploadIntentStatus::Pending->value,
                'expires_at' => now()->addMinutes($ttlMinutes),
            ]);
            $intent->save();

            $signedUpload = $this->storage->createSignedUpload($intent);

            $this->auditLogger->record(
                $actor,
                'review.media_intent_created',
                'product_review',
                (int) $lockedReview->getKey(),
                after: [
                    'intent_token' => $intent->token,
                    'kind' => $kind->value,
                ],
                ipAddress: $ipAddress,
            );

            return [
                'intent' => $intent,
                'upload' => $signedUpload,
            ];
        });
    }

    public function cancelIntent(User $actor, ProductReview $review, string $token, ?string $ipAddress): void
    {
        DB::transaction(function () use ($actor, $review, $token, $ipAddress): void {
            $intent = ReviewUploadIntent::query()
                ->where('token', $token)
                ->where('review_id', $review->getKey())
                ->lockForUpdate()
                ->first();

            if ($intent === null) {
                throw new ReviewRuleException('Upload intent not found.', 404, 'Intent not found');
            }

            if ((int) $intent->user_id !== (int) $actor->getKey()) {
                throw new ReviewRuleException('You are not authorized to cancel this upload intent.', 403, 'Forbidden');
            }

            if ($intent->status === ReviewUploadIntentStatus::Finalized) {
                throw new ReviewRuleException('A finalized upload intent cannot be cancelled.', 409, 'Intent already finalized');
            }

            if ($intent->status === ReviewUploadIntentStatus::Pending) {
                $intent->forceFill(['status' => ReviewUploadIntentStatus::Cancelled->value])->save();

                $this->auditLogger->record(
                    $actor,
                    'review.media_intent_cancelled',
                    'product_review',
                    (int) $review->getKey(),
                    after: ['intent_token' => $intent->token],
                    ipAddress: $ipAddress,
                );
            }
        });
    }

    /** @param array{token: string, sort_order?: int} $payload */
    public function finalize(User $actor, ProductReview $review, array $payload, ?string $ipAddress): ReviewMedia
    {
        $intent = ReviewUploadIntent::query()
            ->where('token', $payload['token'])
            ->where('review_id', $review->getKey())
            ->first();

        if ($intent === null) {
            throw new ReviewRuleException('Upload intent not found for this review.', 404, 'Intent not found');
        }

        if ((int) $intent->user_id !== (int) $actor->getKey()) {
            throw new ReviewRuleException('You are not authorized to finalize this upload.', 403, 'Forbidden');
        }

        if ($intent->status !== ReviewUploadIntentStatus::Pending) {
            throw new ReviewRuleException('This upload intent has already been processed.', 409, 'Intent unavailable');
        }

        if ($intent->expires_at->isPast()) {
            $intent->forceFill(['status' => ReviewUploadIntentStatus::Expired->value])->save();
            throw new ReviewRuleException('This upload intent has expired. Request a new upload signature.', 409, 'Intent expired');
        }

        $this->assertKindEnabled($intent->kind);

        // Verify uploaded bytes, format, type, and video duration against Cloudinary before acquiring DB locks.
        $asset = $this->storage->verifyUploadedAsset($intent);

        try {
            $this->assertVerifiedAsset($intent->kind, $asset);
        } catch (Throwable $exception) {
            $intent->forceFill(['status' => ReviewUploadIntentStatus::Cancelled->value])->save();
            $this->cleanupCloudinaryAsset($asset);

            throw $exception;
        }

        try {
            return DB::transaction(function () use ($actor, $review, $intent, $asset, $payload, $ipAddress): ReviewMedia {
                $lockedReview = ProductReview::query()->whereKey($review->getKey())->lockForUpdate()->firstOrFail();
                $lockedIntent = ReviewUploadIntent::query()->whereKey($intent->getKey())->lockForUpdate()->firstOrFail();

                if ($lockedIntent->status !== ReviewUploadIntentStatus::Pending) {
                    throw new ReviewRuleException('This upload intent has already been processed.', 409, 'Intent unavailable');
                }

                if ($lockedReview->status === ReviewStatus::Hidden) {
                    throw new ReviewRuleException('Media cannot be attached to a hidden review.', 409, 'Review locked');
                }

                $this->assertMediaSlotAvailable($lockedReview, $lockedIntent->kind, includePendingIntents: false);

                $existingCount = $lockedReview->media()->count();
                $media = new ReviewMedia([
                    'sort_order' => isset($payload['sort_order']) ? (int) $payload['sort_order'] : $existingCount,
                ]);
                $media->forceFill([
                    'review_id' => $lockedReview->getKey(),
                    'kind' => $lockedIntent->kind->value,
                    'provider' => 'cloudinary',
                    'storage_path' => $asset->publicId,
                    'asset_id' => $asset->assetId,
                    'resource_type' => $asset->resourceType,
                    'delivery_type' => $asset->deliveryType,
                    'format' => $asset->format,
                    'mime_type' => $asset->mimeType,
                    'bytes' => $asset->bytes,
                    'width' => $asset->width,
                    'height' => $asset->height,
                    'duration_seconds' => $asset->durationSeconds,
                    'status' => ReviewMediaStatus::Ready->value,
                    'video_slot' => $lockedIntent->kind === ReviewMediaKind::Video ? 1 : null,
                ]);

                try {
                    $media->save();
                } catch (UniqueConstraintViolationException) {
                    throw new ReviewRuleException(
                        'Media limit reached or asset is already attached.',
                        409,
                        'Media conflict',
                    );
                }

                $lockedIntent->forceFill([
                    'status' => ReviewUploadIntentStatus::Finalized->value,
                    'finalized_at' => now(),
                ])->save();

                $this->resetApprovalIfNeeded($lockedReview);

                $this->auditLogger->record(
                    $actor,
                    'review.media_attached',
                    'product_review',
                    (int) $lockedReview->getKey(),
                    after: [
                        'media_id' => (int) $media->getKey(),
                        'kind' => $lockedIntent->kind->value,
                        'format' => $media->format,
                        'bytes' => $media->bytes,
                    ],
                    ipAddress: $ipAddress,
                );

                return $media->refresh();
            });
        } catch (Throwable $exception) {
            $this->cleanupCloudinaryAsset($asset);

            throw $exception;
        }
    }

    public function delete(User $actor, ProductReview $review, ReviewMedia $media, ?string $ipAddress): void
    {
        if ((int) $media->review_id !== (int) $review->getKey()) {
            throw new ReviewRuleException('Media item not found for this review.', 404, 'Media not found');
        }

        DB::transaction(function () use ($actor, $review, $media, $ipAddress): void {
            $lockedReview = ProductReview::query()->whereKey($review->getKey())->lockForUpdate()->firstOrFail();

            if ($lockedReview->status === ReviewStatus::Hidden) {
                throw new ReviewRuleException('Media cannot be removed from a hidden review.', 409, 'Review locked');
            }

            $lockedMedia = $lockedReview->media()->whereKey($media->getKey())->lockForUpdate()->first();

            if ($lockedMedia === null) {
                throw new ReviewRuleException('Media item not found for this review.', 404, 'Media not found');
            }

            $before = [
                'media_id' => (int) $lockedMedia->getKey(),
                'kind' => $lockedMedia->kind->value,
                'format' => $lockedMedia->format,
                'bytes' => $lockedMedia->bytes,
            ];

            $lockedMedia->forceFill(['video_slot' => null])->save();
            $lockedMedia->delete();

            $this->resetApprovalIfNeeded($lockedReview);

            $this->auditLogger->record(
                $actor,
                'review.media_removed',
                'product_review',
                (int) $lockedReview->getKey(),
                before: $before,
                ipAddress: $ipAddress,
            );

            DeleteMediaAsset::dispatch(
                $lockedMedia->storage_path,
                $lockedMedia->resource_type,
                $lockedMedia->delivery_type,
            );
        });
    }

    private function assertKindEnabled(ReviewMediaKind $kind): void
    {
        if ($kind === ReviewMediaKind::Video && ! (bool) config('reviews.video.enabled', false)) {
            throw new ReviewRuleException('Video uploads are currently disabled.', 422, 'Video uploads disabled');
        }
    }

    private function assertMediaSlotAvailable(ProductReview $review, ReviewMediaKind $kind, bool $includePendingIntents): void
    {
        $maxCount = (int) config("reviews.{$kind->value}.max_count");
        $activeCount = $review->media()->where('kind', $kind->value)->lockForUpdate()->count();
        $pendingCount = 0;

        if ($includePendingIntents) {
            $pendingCount = ReviewUploadIntent::query()
                ->where('review_id', $review->getKey())
                ->where('kind', $kind->value)
                ->where('status', ReviewUploadIntentStatus::Pending->value)
                ->where('expires_at', '>', now())
                ->lockForUpdate()
                ->count();
        }

        if (($activeCount + $pendingCount) >= $maxCount) {
            $label = $kind === ReviewMediaKind::Image ? 'images' : 'video';
            throw new ReviewRuleException(
                "A review may contain at most {$maxCount} {$label}.",
                422,
                'Media limit reached',
            );
        }
    }

    private function assertClientConstraints(
        ReviewMediaKind $kind,
        string $format,
        string $mimeType,
        int $bytes,
        ?float $durationSeconds,
    ): void {
        /** @var list<string> $allowedFormats */
        $allowedFormats = config("reviews.{$kind->value}.formats", []);
        $maxBytes = (int) config("reviews.{$kind->value}.max_bytes");

        if (! in_array($format, $allowedFormats, true) || ! $this->matchesMime($format, $mimeType)) {
            throw new ReviewRuleException('The selected media format or MIME type is not allowed.', 422, 'Unsupported media format');
        }

        if ($bytes < 1 || $bytes > $maxBytes) {
            throw new ReviewRuleException('The media file exceeds the maximum allowed size.', 422, 'Media size limit exceeded');
        }

        if ($kind === ReviewMediaKind::Video && $durationSeconds !== null) {
            $maxDuration = (int) config('reviews.video.max_duration_seconds', 30);
            if ($durationSeconds <= 0 || $durationSeconds > $maxDuration) {
                throw new ReviewRuleException("Review videos must be at most {$maxDuration} seconds long.", 422, 'Video duration exceeded');
            }
        }
    }

    private function assertVerifiedAsset(ReviewMediaKind $kind, VerifiedReviewAsset $asset): void
    {
        $expectedResourceType = $kind === ReviewMediaKind::Video ? 'video' : 'image';
        /** @var list<string> $allowedFormats */
        $allowedFormats = config("reviews.{$kind->value}.formats", []);
        $maxBytes = (int) config("reviews.{$kind->value}.max_bytes");

        if ($asset->assetId === '' || $asset->deliveryType !== 'authenticated' || $asset->resourceType !== $expectedResourceType) {
            throw new ReviewRuleException('The uploaded media asset failed security verification.', 422, 'Media verification failed');
        }

        if (! in_array($asset->format, $allowedFormats, true)) {
            throw new ReviewRuleException('The uploaded file format is not allowed.', 422, 'Unsupported media format');
        }

        if ($asset->bytes < 1 || $asset->bytes > $maxBytes) {
            throw new ReviewRuleException('The uploaded file exceeds the maximum allowed size.', 422, 'Media size limit exceeded');
        }

        if ($kind === ReviewMediaKind::Video) {
            $maxDuration = (int) config('reviews.video.max_duration_seconds', 30);
            if ($asset->durationSeconds === null || $asset->durationSeconds <= 0 || $asset->durationSeconds > $maxDuration) {
                throw new ReviewRuleException("Review videos must be at most {$maxDuration} seconds long.", 422, 'Video duration exceeded');
            }
        }
    }

    private function matchesMime(string $format, string $mimeType): bool
    {
        return match ($format) {
            'jpg', 'jpeg' => $mimeType === 'image/jpeg',
            'png' => $mimeType === 'image/png',
            'webp' => $mimeType === 'image/webp',
            'mp4' => $mimeType === 'video/mp4',
            'webm' => $mimeType === 'video/webm',
            default => false,
        };
    }

    private function resetApprovalIfNeeded(ProductReview $review): void
    {
        if (in_array($review->status, [ReviewStatus::Approved, ReviewStatus::Rejected], true)) {
            $review->forceFill([
                'status' => ReviewStatus::Pending->value,
                'submitted_at' => now(),
                'published_at' => null,
                'moderated_by_user_id' => null,
                'moderated_at' => null,
                'moderation_reason' => null,
                'lock_version' => $review->lock_version + 1,
            ])->save();
        }
    }

    private function cleanupCloudinaryAsset(VerifiedReviewAsset $asset): void
    {
        try {
            $this->storage->delete($asset->publicId, $asset->resourceType, $asset->deliveryType);
        } catch (Throwable $cleanupException) {
            Log::error('Review Cloudinary compensation delete failed.', [
                'public_id' => $asset->publicId,
                'exception' => $cleanupException,
            ]);
        }
    }
}
