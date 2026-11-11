<?php

namespace App\Domain\Review\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Identity\Models\User;
use App\Domain\Review\Exceptions\ReviewRuleException;
use App\Domain\Review\Models\ProductReview;
use App\Domain\Review\Models\ReviewReply;
use Illuminate\Support\Facades\DB;

final readonly class ManageReviewReply
{
    public function __construct(
        private AuditLogger $auditLogger,
    ) {}

    public function create(User $actor, ProductReview $review, string $body, ?string $ipAddress): ReviewReply
    {
        return $this->persist($actor, $review, $body, mode: 'create', ipAddress: $ipAddress);
    }

    public function update(User $actor, ProductReview $review, string $body, ?string $ipAddress): ReviewReply
    {
        return $this->persist($actor, $review, $body, mode: 'update', ipAddress: $ipAddress);
    }

    public function upsert(User $actor, ProductReview $review, string $body, ?string $ipAddress): ReviewReply
    {
        return $this->persist($actor, $review, $body, mode: 'upsert', ipAddress: $ipAddress);
    }

    public function delete(User $actor, ProductReview $review, ?string $ipAddress): void
    {
        DB::transaction(function () use ($actor, $review, $ipAddress): void {
            $lockedReview = ProductReview::query()->whereKey($review->getKey())->lockForUpdate()->firstOrFail();
            $reply = ReviewReply::query()
                ->where('review_id', $lockedReview->getKey())
                ->lockForUpdate()
                ->first();

            if ($reply === null) {
                throw new ReviewRuleException('Official reply not found for this review.', 404, 'Reply not found');
            }

            $before = [
                'reply_id' => (int) $reply->getKey(),
                'admin_user_id' => (int) $reply->admin_user_id,
                'body' => $reply->body,
            ];

            $reply->delete();

            $this->auditLogger->record(
                $actor,
                'review.reply_deleted',
                'product_review',
                (int) $lockedReview->getKey(),
                before: $before,
                ipAddress: $ipAddress,
            );
        });
    }

    private function persist(
        User $actor,
        ProductReview $review,
        string $body,
        string $mode,
        ?string $ipAddress,
    ): ReviewReply {
        return DB::transaction(function () use ($actor, $review, $body, $mode, $ipAddress): ReviewReply {
            $lockedReview = ProductReview::query()->whereKey($review->getKey())->lockForUpdate()->firstOrFail();
            $existing = ReviewReply::withTrashed()
                ->where('review_id', $lockedReview->getKey())
                ->lockForUpdate()
                ->first();

            $hasActive = $existing !== null && ! $existing->trashed();

            if ($mode === 'create' && $hasActive) {
                throw new ReviewRuleException('An official reply already exists for this review.', 409, 'Reply already exists');
            }

            if ($mode === 'update' && ! $hasActive) {
                throw new ReviewRuleException('Official reply not found for this review.', 404, 'Reply not found');
            }

            $cleanBody = trim($body);
            $before = $hasActive ? [
                'reply_id' => (int) $existing->getKey(),
                'admin_user_id' => (int) $existing->admin_user_id,
                'body' => $existing->body,
            ] : null;

            if ($existing === null) {
                $reply = new ReviewReply(['body' => $cleanBody]);
                $reply->forceFill([
                    'review_id' => $lockedReview->getKey(),
                    'admin_user_id' => $actor->getKey(),
                ]);
                $reply->save();
            } else {
                if ($existing->trashed()) {
                    $existing->restore();
                }

                $existing->forceFill([
                    'admin_user_id' => $actor->getKey(),
                    'body' => $cleanBody,
                ])->save();
                $reply = $existing;
            }

            $action = $hasActive ? 'review.reply_updated' : 'review.reply_created';
            $this->auditLogger->record(
                $actor,
                $action,
                'product_review',
                (int) $lockedReview->getKey(),
                $before,
                [
                    'reply_id' => (int) $reply->getKey(),
                    'admin_user_id' => (int) $reply->admin_user_id,
                    'body' => $reply->body,
                ],
                $ipAddress,
            );

            return $reply->refresh()->load('author:id,name');
        });
    }
}
