<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
final class ProductResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $defaultVariant = $this->relationLoaded('variants')
            ? $this->variants->firstWhere('is_default', true)
            : null;

        return [
            'id' => $this->getKey(),
            'vendor_id' => $this->vendor_id,
            'brand_id' => $this->brand_id,
            'primary_category_id' => $this->primary_category_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'short_description' => $this->short_description,
            'status' => (string) $this->getRawOriginal('status'),
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'new_price' => $defaultVariant instanceof ProductVariant ? $defaultVariant->price : null,
            'old_price' => $defaultVariant instanceof ProductVariant ? $defaultVariant->compare_at_price : null,
            'brand' => new BrandResource($this->whenLoaded('brand')),
            'subcategory' => new CategoryResource($this->whenLoaded('primaryCategory')),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'deleted_at' => $this->deleted_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
