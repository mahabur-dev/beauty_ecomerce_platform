<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Review\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductReview */
final class PublicReviewResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->getKey(),
            'rating' => (int) $this->rating,
            'title' => $this->title,
            'body' => $this->body,
            'verified_purchase' => (bool) $this->verified_purchase,
            'published_at' => $this->published_at?->toISOString(),
            'author' => [
                'name' => $this->user !== null ? $this->user->name : 'Customer',
            ],
            'media' => ReviewMediaResource::collection($this->whenLoaded('readyMedia')),
            'reply' => $this->whenLoaded('reply', fn () => $this->reply === null
                ? null
                : new ReviewReplyResource($this->reply)),
        ];
    }
}
