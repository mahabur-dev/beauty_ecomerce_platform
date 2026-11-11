<?php

namespace App\Http\Controllers\Api\V1\Review;

use App\Domain\Review\Queries\PublicReviewQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Review\IndexPublicReviewsRequest;
use App\Http\Resources\Api\V1\PublicReviewResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class PublicReviewController extends Controller
{
    public function index(
        IndexPublicReviewsRequest $request,
        string $slug,
        PublicReviewQuery $reviews,
    ): AnonymousResourceCollection {
        $product = $reviews->visibleProductBySlug($slug);
        /** @var array{rating?: int|null, with_media?: bool|null, sort?: string|null} $filters */
        $filters = $request->validated();

        $paginator = $reviews->approvedForProduct($product, $filters)
            ->paginate($request->integer('per_page', 10));
        $summary = $reviews->ratingSummary($product);

        return PublicReviewResource::collection($paginator)
            ->additional(['summary' => $summary->toArray()]);
    }

    public function summary(string $slug, PublicReviewQuery $reviews): JsonResponse
    {
        $product = $reviews->visibleProductBySlug($slug);

        return response()->json([
            'data' => $reviews->ratingSummary($product)->toArray(),
        ]);
    }
}
