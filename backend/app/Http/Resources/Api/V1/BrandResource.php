<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Catalog\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Brand */
final class BrandResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->getKey(),
            'name' => (string) $this->name,
            'slug' => (string) $this->slug,
            'status' => (string) $this->getRawOriginal('status'),
            'products_count' => $this->whenCounted('products'),
            'deleted_at' => $this->deleted_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
