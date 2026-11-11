<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Review\Contracts\ReviewMediaStorage;
use App\Domain\Review\Models\ReviewMedia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ReviewMedia */
final class ReviewMediaResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $ttl = (int) config('reviews.delivery_url_ttl_seconds', 300);
        $signed = app(ReviewMediaStorage::class)->signedDeliveryUrl($this->resource, $ttl);

        return [
            'id' => (int) $this->getKey(),
            'review_id' => (int) $this->review_id,
            'kind' => $this->kind->value,
            'format' => $this->format,
            'mime_type' => $this->mime_type,
            'bytes' => (int) $this->bytes,
            'width' => $this->width,
            'height' => $this->height,
            'duration_seconds' => $this->duration_seconds,
            'sort_order' => (int) $this->sort_order,
            'status' => $this->status->value,
            'url' => $signed->url,
            'url_expires_at' => $signed->expiresAt->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
