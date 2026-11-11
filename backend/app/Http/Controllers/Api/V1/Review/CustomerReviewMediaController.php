<?php

namespace App\Http\Controllers\Api\V1\Review;

use App\Domain\Identity\Models\User;
use App\Domain\Review\Actions\ManageReviewMedia;
use App\Domain\Review\Exceptions\ReviewRuleException;
use App\Domain\Review\Models\ProductReview;
use App\Domain\Review\Models\ReviewMedia;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Review\CreateReviewUploadIntentRequest;
use App\Http\Requests\Api\V1\Review\DeleteReviewMediaRequest;
use App\Http\Requests\Api\V1\Review\FinalizeReviewUploadRequest;
use App\Http\Resources\Api\V1\ReviewMediaResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

final class CustomerReviewMediaController extends Controller
{
    public function createIntent(
        CreateReviewUploadIntentRequest $request,
        ProductReview $review,
        ManageReviewMedia $mediaManager,
    ): JsonResponse {
        Gate::authorize('manageMedia', $review);
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{kind: string, format: string, mime_type: string, bytes: int, duration_seconds?: float|int|null} $payload */
        $payload = $request->validated();
        $result = $mediaManager->createIntent($actor, $review, $payload, $request->ip());
        $kindValue = $result['intent']->kind->value;

        return response()->json([
            'data' => [
                'intent_token' => $result['intent']->token,
                'kind' => $kindValue,
                'expires_at' => $result['intent']->expires_at->toISOString(),
                'max_bytes' => (int) config("reviews.{$kindValue}.max_bytes"),
                'allowed_formats' => config("reviews.{$kindValue}.formats", []),
                'upload' => [
                    'url' => $result['upload']->uploadUrl,
                    'method' => $result['upload']->method,
                    'fields' => $result['upload']->fields,
                ],
            ],
        ], Response::HTTP_CREATED);
    }

    public function cancelIntent(
        ProductReview $review,
        string $token,
        ManageReviewMedia $mediaManager,
    ): Response {
        Gate::authorize('manageMedia', $review);
        /** @var User $actor */
        $actor = request()->user();
        $mediaManager->cancelIntent($actor, $review, $token, request()->ip());

        return response()->noContent();
    }

    public function finalize(
        FinalizeReviewUploadRequest $request,
        ProductReview $review,
        ManageReviewMedia $mediaManager,
    ): JsonResponse {
        Gate::authorize('manageMedia', $review);
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{token: string, sort_order?: int} $payload */
        $payload = $request->validated();

        $media = $mediaManager->finalize($actor, $review, $payload, $request->ip());

        return (new ReviewMediaResource($media))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function signedUrl(ProductReview $review, ReviewMedia $media): ReviewMediaResource
    {
        Gate::authorize('viewOwn', $review);

        if ((int) $media->review_id !== (int) $review->getKey()) {
            throw new ReviewRuleException('Media item not found for this review.', 404, 'Media not found');
        }

        return new ReviewMediaResource($media);
    }

    public function destroy(
        DeleteReviewMediaRequest $request,
        ProductReview $review,
        ReviewMedia $media,
        ManageReviewMedia $mediaManager,
    ): Response {
        Gate::authorize('manageMedia', $review);
        /** @var User $actor */
        $actor = $request->user();
        $mediaManager->delete($actor, $review, $media, $request->ip());

        return response()->noContent();
    }
}
