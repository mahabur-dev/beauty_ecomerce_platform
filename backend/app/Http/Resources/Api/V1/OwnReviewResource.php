<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Review\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductReview */
final class OwnReviewResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->getKey(),
            'product_id' => (int) $this->product_id,
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
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'product' => $this->whenLoaded('product', fn () => $this->product === null ? null : [
                'id' => (int) $this->product->getKey(),
                'name' => $this->product->name,
                'slug' => $this->product->slug,
            ]),
            'media' => ReviewMediaResource::collection($this->whenLoaded('readyMedia')),
            'reply' => $this->whenLoaded('reply', fn () => $this->reply === null
                ? null
                : new ReviewReplyResource($this->reply)),
        ];
    }
}
