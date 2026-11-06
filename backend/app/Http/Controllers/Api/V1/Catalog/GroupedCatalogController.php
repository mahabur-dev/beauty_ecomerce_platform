<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Queries\GroupedCatalogQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Catalog\GroupedCatalogRequest;
use App\Http\Resources\Api\V1\PublicCategoryResource;
use App\Http\Resources\Api\V1\PublicProductSummaryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

final class GroupedCatalogController extends Controller
{
    public function __invoke(GroupedCatalogRequest $request, GroupedCatalogQuery $query): JsonResponse
    {
        $result = $query->execute(
            $request->integer('groups_per_page', 10),
            $request->filled('category') ? $request->string('category')->toString() : null,
        );
        $groups = $result['groups'];
        $products = $result['products']->groupBy('primary_category_id');
        $data = $groups->getCollection()->map(function ($group) use ($request, $products): array {
            /** @var Collection<int, Product> $groupProducts */
            $groupProducts = $products->get($group->getKey(), collect());

            return [
                'subcategory' => (new PublicCategoryResource($group))->resolve($request),
                'products' => PublicProductSummaryResource::collection($groupProducts)->resolve($request),
            ];
        })->values();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $groups->currentPage(),
                'from' => $groups->firstItem(),
                'last_page' => $groups->lastPage(),
                'per_page' => $groups->perPage(),
                'to' => $groups->lastItem(),
                'total' => $groups->total(),
                'products_per_group' => 10,
            ],
            'links' => [
                'first' => $groups->url(1),
                'last' => $groups->url($groups->lastPage()),
                'prev' => $groups->previousPageUrl(),
                'next' => $groups->nextPageUrl(),
            ],
        ]);
    }
}
