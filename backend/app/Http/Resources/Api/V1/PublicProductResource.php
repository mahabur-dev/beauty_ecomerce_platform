<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;

final class PublicProductResource extends PublicProductSummaryResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'description' => $this->description,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'variants' => PublicProductVariantResource::collection($this->whenLoaded('variants')),
            'images' => PublicProductImageResource::collection($this->whenLoaded('images')),
        ];
    }
}
