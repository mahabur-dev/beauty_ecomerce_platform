<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Identity\Models\User;
use App\Domain\Review\Actions\ManageReviewReply;
use App\Domain\Review\Models\ProductReview;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\Review\UpsertReviewReplyRequest;
use App\Http\Resources\Api\V1\ReviewReplyResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

final class ReviewReplyController extends Controller
{
    public function store(
        UpsertReviewReplyRequest $request,
        ProductReview $review,
        ManageReviewReply $replies,
    ): JsonResponse {
        Gate::authorize('reply', $review);
        /** @var User $actor */
        $actor = $request->user();
        $reply = $replies->create($actor, $review, $request->string('body')->toString(), $request->ip());

        return (new ReviewReplyResource($reply, includeAdminMetadata: true))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(
        UpsertReviewReplyRequest $request,
        ProductReview $review,
        ManageReviewReply $replies,
    ): ReviewReplyResource {
        Gate::authorize('reply', $review);
        /** @var User $actor */
        $actor = $request->user();
        $reply = $replies->update($actor, $review, $request->string('body')->toString(), $request->ip());

        return new ReviewReplyResource($reply, includeAdminMetadata: true);
    }

    public function upsert(
        UpsertReviewReplyRequest $request,
        ProductReview $review,
        ManageReviewReply $replies,
    ): ReviewReplyResource {
        Gate::authorize('reply', $review);
        /** @var User $actor */
        $actor = $request->user();
        $reply = $replies->upsert($actor, $review, $request->string('body')->toString(), $request->ip());

        return new ReviewReplyResource($reply, includeAdminMetadata: true);
    }

    public function destroy(ProductReview $review, ManageReviewReply $replies): Response
    {
        Gate::authorize('reply', $review);
        /** @var User $actor */
        $actor = request()->user();
        $replies->delete($actor, $review, request()->ip());

        return response()->noContent();
    }
}
