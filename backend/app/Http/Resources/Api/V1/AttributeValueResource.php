<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Catalog\Models\AttributeValue;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AttributeValue */
final class AttributeValueResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->getKey(),
            'attribute_id' => $this->attribute_id,
            'attribute_code' => $this->whenLoaded('attribute', fn () => $this->attribute?->code),
            'code' => $this->code,
            'value' => $this->value,
        ];
    }
}
