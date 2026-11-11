<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Catalog\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Category */
final class CategoryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->getKey(),
            'parent_id' => $this->parent_id !== null ? (int) $this->parent_id : null,
            'name' => (string) $this->name,
            'slug' => (string) $this->slug,
            'description' => $this->description,
            'status' => (string) $this->getRawOriginal('status'),
            'sort_order' => (int) ($this->sort_order ?? 0),
            'image' => $this->imagePayload(includeBytes: true),
            'children_count' => $this->whenCounted('children'),
            'products_count' => $this->whenCounted('products'),
            'parent' => new self($this->whenLoaded('parent')),
            'children' => self::collection($this->whenLoaded('children')),
            'deleted_at' => $this->deleted_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
