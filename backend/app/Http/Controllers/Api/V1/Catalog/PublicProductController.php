<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Domain\Catalog\Queries\PublicProductQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Catalog\IndexPublicProductsRequest;
use App\Http\Resources\Api\V1\PublicProductResource;
use App\Http\Resources\Api\V1\PublicProductSummaryResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class PublicProductController extends Controller
{
    public function index(IndexPublicProductsRequest $request, PublicProductQuery $products): AnonymousResourceCollection
    {
        /** @var array<string, mixed> $filters */
        $filters = $request->validated();

        return PublicProductSummaryResource::collection(
            $products->filtered($filters)
                ->with($products->summaryRelations())
                ->paginate($request->integer('per_page', 20)),
        );
    }

    public function show(string $slug, PublicProductQuery $products): PublicProductResource
    {
        $product = $products->visible()
            ->where('slug', $slug)
            ->with($products->detailRelations())
            ->firstOrFail();

        return new PublicProductResource($product);
    }
}
