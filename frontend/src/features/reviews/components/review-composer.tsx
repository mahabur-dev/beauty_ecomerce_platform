"use client";

import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Alert, Button, DismissibleAlert } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

import {
  createProductReview,
  deleteReviewMedia,
  updateProductReview,
} from "../api";
import { REVIEW_BODY_MAX_LENGTH } from "../constants";
import {
  extractReviewFieldErrors,
  getReviewErrorMessage,
  isVersionConflictError,
} from "../errors";
import { invalidateProductReviewQueries } from "../hooks";
import {
  extractZodReviewErrors,
  reviewFormSchema,
  type ReviewFieldErrors,
} from "../schemas";
import type { OwnReview } from "../types";
import { ReviewMediaUploader } from "./review-media-uploader";
import { StarRatingInput } from "./star-rating";
import type { MediaUploadQueueController } from "./use-media-upload-queue";

export interface ReviewComposerProps {
  productSlug: string;
  productName: string;
  mode: "create" | "edit";
  initialReview?: OwnReview | undefined;
  uploader: MediaUploadQueueController;
  onSuccess: (review: OwnReview, message: string, keepEditorOpen?: boolean) => void;
  onCancel: () => void;
  onReloadConflictReview?: (() => Promise<void>) | undefined;
  onRefreshMediaUrl?:
    | ((mediaId: number) => Promise<OwnReview["media"][number] | null>)
    | undefined;
}

export function ReviewComposer({
  productSlug,
  productName,
  mode,
  initialReview,
  uploader,
  onSuccess,
  onCancel,
  onReloadConflictReview,
  onRefreshMediaUrl,
}: ReviewComposerProps) {
  const queryClient = useQueryClient();
  const bodyFieldId = useId();
  const bodyErrorId = `${bodyFieldId}-error`;

  const [rating, setRating] = useState<number>(initialReview?.rating ?? 5);
  const [body, setBody] = useState<string>(initialReview?.body ?? "");
  const [fieldErrors, setFieldErrors] = useState<ReviewFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingMediaId, setRemovingMediaId] = useState<number | null>(null);

  const isEdit = mode === "edit" && Boolean(initialReview);

  async function handleRemoveExistingMedia(mediaId: number) {
    if (!initialReview) return;

    setRemovingMediaId(mediaId);
    setFormError(null);
    try {
      await deleteReviewMedia(initialReview.id, mediaId);
      await invalidateProductReviewQueries(queryClient, productSlug);
    } catch (error) {
      setFormError(getReviewErrorMessage(error));
    } finally {
      setRemovingMediaId(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setHasConflict(false);
    uploader.clearValidationErrors();

    const parsed = reviewFormSchema.safeParse({
      rating,
      body,
    });

    if (!parsed.success) {
      setFieldErrors(extractZodReviewErrors(parsed.error));
      return;
    }

    const normalizedBody = parsed.data.body;

    setIsSubmitting(true);

    try {
      if (isEdit && initialReview) {
        const textOrRatingChanged =
          parsed.data.rating !== initialReview.rating ||
          normalizedBody !== (initialReview.body ?? "").trim();

        let updatedReview = initialReview;
        if (textOrRatingChanged) {
          updatedReview = await updateProductReview(initialReview.id, {
            rating: parsed.data.rating,
            body: normalizedBody,
            lock_version: initialReview.lock_version,
          });
        }

        let mediaMessage = "";
        if (uploader.queue.length > 0) {
          const uploadResult = await uploader.uploadItemsForReview(
            updatedReview.id,
            updatedReview.media.length,
          );

          await invalidateProductReviewQueries(queryClient, productSlug);

          if (uploadResult.failedCount > 0) {
            onSuccess(
              updatedReview,
              `Your review text was updated, though ${uploadResult.failedCount} media ${uploadResult.failedCount === 1 ? "file" : "files"} failed to upload. You can retry below.`,
              true,
            );
            return;
          }

          if (uploadResult.uploaded.length > 0) {
            mediaMessage = " Media attached successfully.";
          }
        } else {
          await invalidateProductReviewQueries(queryClient, productSlug);
        }

        const note =
          initialReview.status === "approved"
            ? "Your updated review has been submitted and is pending moderation."
            : `Your review has been updated and queued for moderation.${mediaMessage}`;

        onSuccess(updatedReview, note, false);
        return;
      }

      const createdReview = await createProductReview(productSlug, {
        rating: parsed.data.rating,
        body: normalizedBody,
      });

      if (uploader.queue.length > 0) {
        const uploadResult = await uploader.uploadItemsForReview(
          createdReview.id,
          0,
        );

        await invalidateProductReviewQueries(queryClient, productSlug);

        if (uploadResult.failedCount > 0) {
          onSuccess(
            createdReview,
            `Thank you! Your review was submitted for moderation, though ${uploadResult.failedCount} media ${uploadResult.failedCount === 1 ? "file" : "files"} failed to upload. You can retry directly on your review card below.`,
            false,
          );
          return;
        }
      } else {
        await invalidateProductReviewQueries(queryClient, productSlug);
      }

      onSuccess(
        createdReview,
        "Thank you! Your review has been submitted and is currently pending moderation.",
        false,
      );
    } catch (error) {
      setFieldErrors(extractReviewFieldErrors(error));
      setHasConflict(isVersionConflictError(error));
      setFormError(getReviewErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
      className="border-brand-100 bg-surface-elevated shadow-soft space-y-5 rounded-3xl border p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-ink text-lg font-bold sm:text-xl">
            {isEdit
              ? `Edit your review for ${productName}`
              : `Write a review for ${productName}`}
          </h3>
          <p className="text-ink-muted mt-1 text-sm">
            Reviews appear publicly once approved by our moderation team.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isSubmitting || uploader.isProcessing}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>

      {isEdit && initialReview?.status === "approved" ? (
        <Alert tone="warning">
          Editing an approved review or changing its photos/videos will return it
          to pending moderation until reviewed again.
        </Alert>
      ) : null}

      {isEdit && initialReview?.status === "rejected" ? (
        <Alert tone="warning">
          Updating your review or media will resubmit it for moderation review.
        </Alert>
      ) : null}

      {formError ? (
        <DismissibleAlert
          tone="error"
          onDismiss={() => {
            setFormError(null);
            setHasConflict(false);
          }}
          action={
            hasConflict && onReloadConflictReview ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="size-3.5" aria-hidden="true" />}
                onClick={() => void onReloadConflictReview()}
              >
                Reload latest review
              </Button>
            ) : undefined
          }
        >
          {formError}
        </DismissibleAlert>
      ) : null}

      <StarRatingInput
        value={rating}
        onChange={setRating}
        disabled={isSubmitting || uploader.isProcessing}
        error={fieldErrors.rating}
      />

      <div className="w-full">
        <label
          htmlFor={bodyFieldId}
          className="text-ink mb-2 block text-sm font-semibold"
        >
          Your review
          <span className="text-brand-600 ml-1" aria-hidden="true">
            *
          </span>
        </label>
        <textarea
          id={bodyFieldId}
          rows={4}
          required
          maxLength={REVIEW_BODY_MAX_LENGTH}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={isSubmitting || uploader.isProcessing}
          aria-invalid={fieldErrors.body ? true : undefined}
          aria-describedby={fieldErrors.body ? bodyErrorId : undefined}
          placeholder="What did you like or dislike? How did this product work in your routine?"
          className={cn(
            "border-line bg-surface-elevated text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:ring-brand-100 w-full rounded-xl border px-3.5 py-2.5 text-sm transition outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
            fieldErrors.body &&
              "border-danger-600 focus:border-danger-600 focus:ring-danger-100",
          )}
        />
        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
          {fieldErrors.body ? (
            <p id={bodyErrorId} className="text-danger-600 font-medium">
              {fieldErrors.body}
            </p>
          ) : (
            <span className="text-ink-muted">
              Helpful details help fellow shoppers choose with confidence.
            </span>
          )}
          <span className="text-ink-muted tabular-nums">
            {body.length}/{REVIEW_BODY_MAX_LENGTH}
          </span>
        </div>
      </div>

      <ReviewMediaUploader
        uploader={uploader}
        existingMedia={initialReview?.media ?? []}
        reviewId={initialReview?.id ?? null}
        disabled={isSubmitting}
        onRemoveExistingMedia={
          isEdit ? (mediaId) => void handleRemoveExistingMedia(mediaId) : undefined
        }
        removingMediaId={removingMediaId}
        onRefreshExistingMediaUrl={onRefreshMediaUrl}
      />

      <div className="border-line flex flex-wrap items-center justify-end gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting || uploader.isProcessing}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting || uploader.isProcessing}
          loadingText={isEdit ? "Saving changes…" : "Submitting review…"}
        >
          {isEdit ? "Save Changes" : "Submit Review"}
        </Button>
      </div>
    </form>
  );
}

