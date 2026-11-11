<?php

namespace App\Http\Controllers\Api\V1\Review;

use App\Domain\Identity\Models\User;
use App\Domain\Review\Actions\ManageCustomerReviews;
use App\Domain\Review\Models\ProductReview;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Review\IndexOwnReviewsRequest;
use App\Http\Requests\Api\V1\Review\StoreReviewRequest;
use App\Http\Requests\Api\V1\Review\UpdateReviewRequest;
use App\Http\Resources\Api\V1\OwnReviewResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

final class CustomerReviewController extends Controller
{
    public function index(IndexOwnReviewsRequest $request): AnonymousResourceCollection
    {
        /** @var User $actor */
        $actor = $request->user();
        $query = ProductReview::query()
            ->where('user_id', $actor->getKey())
            ->with(['product:id,name,slug', 'readyMedia', 'reply.author:id,name']);

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
        }

        if ($request->filled('product_slug')) {
            $slug = $request->string('product_slug')->toString();
            $query->whereHas('product', fn (Builder $builder) => $builder->where('slug', $slug));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return OwnReviewResource::collection(
            $query->latest('updated_at')->latest('id')->paginate($request->integer('per_page', 20)),
        );
    }

    public function show(ProductReview $review): OwnReviewResource
    {
        Gate::authorize('viewOwn', $review);

        return new OwnReviewResource(
            $review->load(['product:id,name,slug', 'readyMedia', 'reply.author:id,name']),
        );
    }

    public function store(
        StoreReviewRequest $request,
        string $slug,
        ManageCustomerReviews $reviews,
    ): JsonResponse {
        Gate::authorize('create', ProductReview::class);
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{rating: int, title?: string|null, body?: string|null} $payload */
        $payload = $request->validated();

        return (new OwnReviewResource($reviews->create($actor, $slug, $payload, $request->ip())))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(
        UpdateReviewRequest $request,
        ProductReview $review,
        ManageCustomerReviews $reviews,
    ): OwnReviewResource {
        Gate::authorize('update', $review);
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{rating?: int, title?: string|null, body?: string|null, lock_version?: int} $payload */
        $payload = $request->validated();

        return new OwnReviewResource($reviews->update($actor, $review, $payload, $request->ip()));
    }

    public function destroy(ProductReview $review, ManageCustomerReviews $reviews): Response
    {
        Gate::authorize('delete', $review);
        /** @var User $actor */
        $actor = request()->user();
        $reviews->delete($actor, $review, request()->ip());

        return response()->noContent();
    }
}
