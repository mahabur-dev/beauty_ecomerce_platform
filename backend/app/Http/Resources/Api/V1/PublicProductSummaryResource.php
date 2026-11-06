<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class PublicProductSummaryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $default = $this->relationLoaded('variants')
            ? $this->variants->firstWhere('is_default', true)
            : null;
        $primaryImage = $this->relationLoaded('images') ? $this->images->first() : null;

        return [
            'id' => $this->getKey(),
            'name' => $this->name,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'new_price' => $default instanceof ProductVariant ? $default->price : null,
            'old_price' => $default instanceof ProductVariant ? $default->compare_at_price : null,
            'brand' => $this->whenLoaded('brand', fn () => $this->brand === null ? null : [
                'name' => $this->brand->name,
                'slug' => $this->brand->slug,
            ]),
            'category' => $this->whenLoaded('primaryCategory', fn () => $this->primaryCategory?->parent === null ? null : [
                'name' => $this->primaryCategory->parent->name,
                'slug' => $this->primaryCategory->parent->slug,
            ]),
            'subcategory' => $this->whenLoaded('primaryCategory', fn () => [
                'name' => $this->primaryCategory?->name,
                'slug' => $this->primaryCategory?->slug,
            ]),
            'primary_image' => $primaryImage === null ? null : (new PublicProductImageResource($primaryImage))->resolve($request),
        ];
    }
}
