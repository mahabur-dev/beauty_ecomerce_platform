<?php

namespace App\Domain\Review\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Identity\Models\User;
use App\Domain\Review\Enums\ReviewStatus;
use App\Domain\Review\Exceptions\ReviewRuleException;
use App\Domain\Review\Models\ProductReview;
use Illuminate\Support\Facades\DB;

final readonly class ModerateProductReview
{
    public function __construct(
        private AuditLogger $auditLogger,
    ) {}

    /** @param array{status: string, reason: string, lock_version?: int} $payload */
    public function execute(User $actor, ProductReview $review, array $payload, ?string $ipAddress): ProductReview
    {
        $targetStatus = ReviewStatus::from((string) $payload['status']);

        if (! in_array($targetStatus, [ReviewStatus::Approved, ReviewStatus::Rejected, ReviewStatus::Hidden], true)) {
            throw new ReviewRuleException('Moderation status must be approved, rejected, or hidden.');
        }

        return DB::transaction(function () use ($actor, $review, $targetStatus, $payload, $ipAddress): ProductReview {
            $locked = ProductReview::query()->whereKey($review->getKey())->lockForUpdate()->firstOrFail();

            if (array_key_exists('lock_version', $payload) && (int) $payload['lock_version'] !== (int) $locked->lock_version) {
                throw new ReviewRuleException(
                    'This review was modified concurrently. Refresh and try again.',
                    409,
                    'Version conflict',
                );
            }

            if ($locked->status === $targetStatus) {
                throw new ReviewRuleException(
                    "Review is already in status [{$targetStatus->value}].",
                    409,
                    'Invalid status transition',
                );
            }

            $before = $this->snapshot($locked);
            $reason = trim((string) $payload['reason']);

            $locked->forceFill([
                'status' => $targetStatus->value,
                'published_at' => $targetStatus === ReviewStatus::Approved ? ($locked->published_at ?? now()) : null,
                'moderated_by_user_id' => $actor->getKey(),
                'moderated_at' => now(),
                'moderation_reason' => $reason,
                'lock_version' => $locked->lock_version + 1,
            ]);
            $locked->save();

            $this->auditLogger->record(
                $actor,
                'review.'.$targetStatus->value,
                'product_review',
                (int) $locked->getKey(),
                $before,
                $this->snapshot($locked),
                $ipAddress,
            );

            return $locked->refresh()->load([
                'product:id,vendor_id,name,slug',
                'user:id,name,email',
                'moderator:id,name',
                'readyMedia',
                'reply.author:id,name',
            ]);
        });
    }

    /** @return array<string, mixed> */
    private function snapshot(ProductReview $review): array
    {
        return $review->only([
            'status',
            'published_at',
            'moderated_by_user_id',
            'moderated_at',
            'moderation_reason',
            'lock_version',
        ]);
    }
}
