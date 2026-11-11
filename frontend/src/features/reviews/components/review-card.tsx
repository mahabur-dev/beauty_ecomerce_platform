"use client";

import {
  CheckCircle2,
  Clock,
  EyeOff,
  MessageSquareText,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";

import { Alert, Badge, Button, DismissibleAlert } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

import type {
  OwnReview,
  PublicReview,
  ReviewMediaItem,
  ReviewStatus,
} from "../types";
import { formatReviewDate } from "../utils";
import { ReviewMediaGallery } from "./review-media-gallery";
import { ReviewMediaUploader } from "./review-media-uploader";
import { StarRatingDisplay } from "./star-rating";
import type { MediaUploadQueueController } from "./use-media-upload-queue";

const UNPUBLISHED_STATUS_META: Partial<
  Record<
    ReviewStatus,
    {
      label: string;
      variant: "warning" | "danger" | "neutral";
      icon: typeof Clock;
      helper: string;
    }
  >
> = {
  pending: {
    label: "Pending moderation",
    variant: "warning",
    icon: Clock,
    helper:
      "Only visible to you while our moderation team reviews it for publication.",
  },
  rejected: {
    label: "Not published",
    variant: "danger",
    icon: XCircle,
    helper:
      "Your review was not published. You can edit it and resubmit for moderation.",
  },
  hidden: {
    label: "Hidden by moderator",
    variant: "neutral",
    icon: EyeOff,
    helper:
      "Hidden reviews cannot be edited. You may delete this review if you wish to submit a new one.",
  },
};

export interface ReviewCardProps {
  review: PublicReview;
  ownerReview?: OwnReview | undefined;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  onRefreshMediaUrl?:
    | ((mediaId: number) => Promise<ReviewMediaItem | null>)
    | undefined;
  onRemoveMedia?: ((mediaId: number) => void) | undefined;
  removingMediaId?: number | null | undefined;
  uploader?: MediaUploadQueueController | undefined;
  onRetryQueueItem?: ((localId: string) => void) | undefined;
  cardError?: string | null | undefined;
  onDismissCardError?: (() => void) | undefined;
}

/** Renders a public or owner-enriched review card within the unified product review list. */
export function ReviewCard({
  review,
  ownerReview,
  onEdit,
  onDelete,
  onRefreshMediaUrl,
  onRemoveMedia,
  removingMediaId = null,
  uploader,
  onRetryQueueItem,
  cardError = null,
  onDismissCardError,
}: ReviewCardProps) {
  const isOwnCard = Boolean(ownerReview);
  const isHidden = ownerReview?.status === "hidden";
  const ownerStatusMeta = ownerReview
    ? UNPUBLISHED_STATUS_META[ownerReview.status]
    : undefined;
  const StatusIcon = ownerStatusMeta?.icon;

  const authorName = review.author.name || "Customer";
  const authorInitial = authorName.charAt(0).toUpperCase() || "C";
  const displayRating = ownerReview?.rating ?? review.rating;
  const displayTitle = ownerReview ? ownerReview.title : review.title;
  const displayBody = ownerReview ? ownerReview.body : review.body;
  const displayVerified = ownerReview
    ? ownerReview.verified_purchase
    : review.verified_purchase;
  const displayMedia = ownerReview ? ownerReview.media : review.media;
  const displayReply = ownerReview ? ownerReview.reply : review.reply;

  const dateLabel =
    ownerReview && ownerReview.status !== "approved"
      ? formatReviewDate(ownerReview.submitted_at ?? ownerReview.created_at)
      : formatReviewDate(review.published_at);

  return (
    <article
      className={cn(
        "bg-surface-elevated shadow-soft rounded-3xl border p-5 sm:p-6",
        isOwnCard ? "border-brand-200" : "border-line",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="bg-brand-100 text-brand-700 grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold"
          >
            {authorInitial}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-ink text-sm font-bold sm:text-base">
                {authorName}
              </span>
              {isOwnCard ? <Badge variant="brand">Your review</Badge> : null}
              {ownerStatusMeta && StatusIcon ? (
                <Badge variant={ownerStatusMeta.variant} className="gap-1">
                  <StatusIcon className="size-3" aria-hidden="true" />
                  {ownerStatusMeta.label}
                </Badge>
              ) : null}
              {displayVerified ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  Verified Purchase
                </Badge>
              ) : null}
            </div>
            {dateLabel ? (
              <p className="text-ink-muted mt-0.5 text-xs">
                {ownerReview && ownerReview.status !== "approved"
                  ? `Submitted ${dateLabel}`
                  : dateLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <StarRatingDisplay rating={displayRating} size="sm" />
          {ownerReview ? (
            <div className="flex items-center gap-1.5">
              {!isHidden && onEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Pencil className="size-3.5" aria-hidden="true" />}
                  onClick={onEdit}
                >
                  Edit review
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  type="button"
                  variant="danger-outline"
                  size="sm"
                  leftIcon={<Trash2 className="size-3.5" aria-hidden="true" />}
                  onClick={onDelete}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {ownerStatusMeta ? (
        <p className="text-ink-muted mt-3 text-xs">{ownerStatusMeta.helper}</p>
      ) : null}

      {ownerReview?.moderation_reason &&
      (ownerReview.status === "rejected" || ownerReview.status === "hidden") ? (
        <div className="mt-3">
          <Alert tone="error" title="Moderation note">
            {ownerReview.moderation_reason}
          </Alert>
        </div>
      ) : null}

      {cardError && onDismissCardError ? (
        <div className="mt-3">
          <DismissibleAlert tone="error" onDismiss={onDismissCardError}>
            {cardError}
          </DismissibleAlert>
        </div>
      ) : null}

      <div className="mt-4 space-y-2.5">
        {displayTitle ? (
          <h3 className="text-ink text-base font-bold sm:text-lg">
            {displayTitle}
          </h3>
        ) : null}

        {displayBody ? (
          <p className="text-ink/85 text-sm leading-relaxed whitespace-pre-line sm:text-base">
            {displayBody}
          </p>
        ) : null}
      </div>

      {displayMedia.length > 0 ? (
        <div className="mt-4 space-y-2">
          {ownerReview && ownerReview.status !== "approved" ? (
            <p className="text-ink-muted text-xs font-medium">
              Private pending media preview (visible only to you and moderators)
            </p>
          ) : null}
          <ReviewMediaGallery
            media={displayMedia}
            reviewerLabel={isOwnCard ? "you" : authorName}
            onRefreshUrl={onRefreshMediaUrl}
            onRemoveMedia={isOwnCard && !isHidden ? onRemoveMedia : undefined}
            removingMediaId={removingMediaId}
          />
        </div>
      ) : null}

      {ownerReview &&
      !isHidden &&
      uploader &&
      uploader.queue.length > 0 &&
      onRetryQueueItem ? (
        <div className="mt-4">
          <Alert tone="warning" title="Pending media uploads">
            Retry failed uploads or remove them from your queue.
          </Alert>
          <div className="mt-3">
            <ReviewMediaUploader
              uploader={uploader}
              existingMedia={ownerReview.media}
              reviewId={ownerReview.id}
              onRetryQueueItem={onRetryQueueItem}
            />
          </div>
        </div>
      ) : null}

      {displayReply ? (
        <aside className="bg-surface-subtle border-brand-100 mt-5 rounded-2xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquareText
                className="text-brand-600 size-4 shrink-0"
                aria-hidden="true"
              />
              <span className="text-ink text-xs font-bold sm:text-sm">
                {displayReply.author_name}
              </span>
              <Badge variant="brand">Official Response</Badge>
            </div>
            {formatReviewDate(
              displayReply.updated_at ?? displayReply.created_at,
            ) ? (
              <span className="text-ink-muted text-xs">
                {formatReviewDate(
                  displayReply.updated_at ?? displayReply.created_at,
                )}
              </span>
            ) : null}
          </div>
          <p className="text-ink/85 mt-2 text-sm leading-relaxed whitespace-pre-line">
            {displayReply.body}
          </p>
        </aside>
      ) : null}
    </article>
  );
}

