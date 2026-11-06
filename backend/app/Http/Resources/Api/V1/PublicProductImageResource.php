<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Catalog\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductImage */
final class PublicProductImageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->getKey(),
            'variant_id' => $this->product_variant_id,
            'url' => $this->secure_url,
            'format' => $this->format,
            'width' => $this->width,
            'height' => $this->height,
            'alt_text' => $this->alt_text,
            'is_primary' => $this->is_primary,
        ];
    }
}
