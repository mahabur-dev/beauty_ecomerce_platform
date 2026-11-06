<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Catalog\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductVariant */
final class PublicProductVariantResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->getKey(),
            'sku' => $this->sku,
            'title' => $this->title,
            'price' => $this->price,
            'compare_at_price' => $this->compare_at_price,
            'is_default' => $this->is_default,
            'attribute_values' => $this->whenLoaded('attributeValues', fn () => $this->attributeValues->map(fn ($value): array => [
                'id' => $value->getKey(),
                'attribute' => $value->attribute?->name,
                'attribute_code' => $value->attribute?->code,
                'value' => $value->value,
                'code' => $value->code,
            ])->values()),
        ];
    }
}
