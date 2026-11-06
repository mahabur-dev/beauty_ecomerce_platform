<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Catalog\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductImage */
final class ProductImageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->getKey(),
            'product_id' => $this->product_id,
            'product_variant_id' => $this->product_variant_id,
            'url' => $this->secure_url,
            'format' => $this->format,
            'bytes' => $this->bytes,
            'width' => $this->width,
            'height' => $this->height,
            'alt_text' => $this->alt_text,
            'sort_order' => $this->sort_order,
            'is_primary' => $this->is_primary,
            'created_at' => $this->created_at,
        ];
    }
}
