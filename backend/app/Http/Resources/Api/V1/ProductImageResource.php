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
            'id' => (int) $this->getKey(),
            'product_id' => (int) $this->product_id,
            'product_variant_id' => $this->product_variant_id ? (int) $this->product_variant_id : null,
            'url' => (string) ($this->secure_url ?? ''),
            'format' => $this->format,
            'bytes' => $this->bytes,
            'width' => $this->width !== null ? (int) $this->width : null,
            'height' => $this->height !== null ? (int) $this->height : null,
            'alt_text' => $this->alt_text,
            'sort_order' => (int) ($this->sort_order ?? 0),
            'is_primary' => (bool) $this->is_primary,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
