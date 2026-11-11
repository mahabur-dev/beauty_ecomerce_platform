<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Identity\Models\User;
use App\Domain\Review\Actions\ModerateProductReview;
use App\Domain\Review\Models\ProductReview;
use App\Domain\Review\Queries\AdminReviewQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\Review\IndexAdminReviewsRequest;
use App\Http\Requests\Api\V1\Admin\Review\ModerateReviewRequest;
use App\Http\Resources\Api\V1\AdminReviewResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

final class ReviewController extends Controller
{
    public function index(IndexAdminReviewsRequest $request, AdminReviewQuery $reviews): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', ProductReview::class);
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{search?: string|null, status?: string|null, rating?: int|null, product_id?: int|null, with_media?: bool|null, date_from?: string|null, date_to?: string|null, trash?: string|null, sort?: string|null} $filters */
        $filters = $request->validated();

        return AdminReviewResource::collection(
            $reviews->forActor($actor, $filters)->paginate($request->integer('per_page', 20)),
        );
    }

    public function show(int $review, AdminReviewQuery $reviews): AdminReviewResource
    {
        $found = ProductReview::withTrashed()->findOrFail($review);
        Gate::authorize('viewAsAdmin', $found);

        $found->load([
            'product:id,vendor_id,name,slug',
            'user:id,name,email',
            'moderator:id,name',
            'readyMedia',
            'reply.author:id,name',
        ]);

        return (new AdminReviewResource($found))
            ->withAuditLogs($reviews->auditTimeline($found));
    }

    public function moderate(
        ModerateReviewRequest $request,
        ProductReview $review,
        ModerateProductReview $moderator,
    ): AdminReviewResource {
        Gate::authorize('moderate', $review);
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{status: string, reason: string, lock_version?: int} $payload */
        $payload = $request->validated();

        return new AdminReviewResource(
            $moderator->execute($actor, $review, $payload, $request->ip()),
        );
    }
}
