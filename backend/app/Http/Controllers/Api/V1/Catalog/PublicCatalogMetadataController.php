<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Domain\Catalog\Models\Attribute;
use App\Domain\Catalog\Models\Brand;
use App\Domain\Shared\Enums\RecordStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Catalog\IndexPublicCategoriesRequest;
use App\Http\Resources\Api\V1\PublicBrandResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class PublicCatalogMetadataController extends Controller
{
    public function brands(IndexPublicCategoriesRequest $request): AnonymousResourceCollection
    {
        $query = Brand::query()->where('status', RecordStatus::Active->value)->orderBy('name');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->string('search')->toString().'%');
        }

        return PublicBrandResource::collection($query->paginate($request->integer('per_page', 100)));
    }

    public function brand(string $slug): PublicBrandResource
    {
        return new PublicBrandResource(
            Brand::query()->where('slug', $slug)->where('status', RecordStatus::Active->value)->firstOrFail(),
        );
    }

    public function facets(): JsonResponse
    {
        $brands = Brand::query()->where('status', RecordStatus::Active->value)
            ->orderBy('name')->limit(100)->get();
        $attributes = Attribute::query()->with(['values' => fn ($query) => $query
            ->orderBy('value')->limit(100)])
            ->orderBy('name')->limit(100)->get();

        return response()->json([
            'data' => [
                'brands' => PublicBrandResource::collection($brands)->resolve(request()),
                'attributes' => $attributes->map(fn (Attribute $attribute): array => [
                    'id' => $attribute->getKey(),
                    'name' => $attribute->name,
                    'code' => $attribute->code,
                    'values' => $attribute->values->map(fn ($value): array => [
                        'id' => $value->getKey(),
                        'value' => $value->value,
                        'code' => $value->code,
                    ])->values(),
                ])->values(),
            ],
            'meta' => ['max_brands' => 100, 'max_attributes' => 100, 'max_values_per_attribute' => 100],
        ]);
    }
}
