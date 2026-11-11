<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Review\Models\ProductReview;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductReview */
final class AdminReviewResource extends JsonResource
{
    /** @var Collection<int, AuditLog>|null */
    private ?Collection $auditLogs = null;

    /** @param Collection<int, AuditLog> $auditLogs */
    public function withAuditLogs(Collection $auditLogs): self
    {
        $this->auditLogs = $auditLogs;

        return $this;
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $payload = [
            'id' => (int) $this->getKey(),
            'product_id' => (int) $this->product_id,
            'user_id' => (int) $this->user_id,
            'vendor_id' => (int) $this->vendor_id,
            'rating' => (int) $this->rating,
            'title' => $this->title,
            'body' => $this->body,
            'status' => $this->status->value,
            'verified_purchase' => (bool) $this->verified_purchase,
            'moderation_reason' => $this->moderation_reason,
            'lock_version' => (int) $this->lock_version,
            'submitted_at' => $this->submitted_at?->toISOString(),
            'published_at' => $this->published_at?->toISOString(),
            'moderated_at' => $this->moderated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'product' => $this->whenLoaded('product', fn () => $this->product === null ? null : [
                'id' => (int) $this->product->getKey(),
                'vendor_id' => (int) $this->product->vendor_id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
            ]),
            'author' => $this->whenLoaded('user', fn () => $this->user === null ? null : [
                'id' => (int) $this->user->getKey(),
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'moderator' => $this->whenLoaded('moderator', fn () => $this->moderator === null ? null : [
                'id' => (int) $this->moderator->getKey(),
                'name' => $this->moderator->name,
            ]),
            'media' => ReviewMediaResource::collection($this->whenLoaded('readyMedia')),
            'reply' => $this->whenLoaded('reply', fn () => $this->reply === null
                ? null
                : new ReviewReplyResource($this->reply, includeAdminMetadata: true)),
        ];

        if ($this->auditLogs !== null) {
            $payload['audit_logs'] = $this->auditLogs->map(static fn (AuditLog $log): array => [
                'id' => (int) $log->getKey(),
                'action' => $log->action,
                'actor' => $log->actor === null ? null : [
                    'id' => (int) $log->actor->getKey(),
                    'name' => $log->actor->name,
                ],
                'before' => $log->before_json,
                'after' => $log->after_json,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->toISOString(),
            ])->values();
        }

        return $payload;
    }
}
