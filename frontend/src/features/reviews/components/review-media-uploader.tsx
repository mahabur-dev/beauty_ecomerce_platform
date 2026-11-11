"use client";

import {
  Film,
  ImagePlus,
  Loader2,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";
import { useId, type ChangeEvent } from "react";

import { Button, DismissibleAlert } from "@/components/ui";
import { env } from "@/config/env";
import { cn } from "@/lib/utils/cn";

import {
  REVIEW_IMAGE_MAX_COUNT,
  REVIEW_VIDEO_MAX_COUNT,
  REVIEW_VIDEO_MAX_DURATION_SECONDS,
} from "../constants";
import type { MediaQueueStatus, MediaUploadQueueItem, ReviewMediaItem } from "../types";
import { formatFileSize } from "../utils";
import { ReviewMediaGallery, SignedMediaImage } from "./review-media-gallery";
import type { MediaUploadQueueController } from "./use-media-upload-queue";

export interface ReviewMediaUploaderProps {
  uploader: MediaUploadQueueController;
  existingMedia?: ReviewMediaItem[] | undefined;
  reviewId?: number | null | undefined;
  disabled?: boolean | undefined;
  videoEnabled?: boolean | undefined;
  onRemoveExistingMedia?: ((mediaId: number) => void) | undefined;
  removingMediaId?: number | null | undefined;
  onRefreshExistingMediaUrl?:
    | ((mediaId: number) => Promise<ReviewMediaItem | null>)
    | undefined;
  onRetryQueueItem?: ((localId: string) => void) | undefined;
  onFilesAddedImmediately?: ((added: MediaUploadQueueItem[]) => void) | undefined;
}

const statusLabelMap: Record<MediaQueueStatus, string> = {
  queued: "Ready to upload",
  signing: "Preparing secure upload…",
  uploading: "Uploading…",
  finalizing: "Verifying asset…",
  uploaded: "Uploaded",
  error: "Upload failed",
};

export function ReviewMediaUploader({
  uploader,
  existingMedia = [],
  reviewId = null,
  disabled = false,
  videoEnabled = env.reviewVideoEnabled,
  onRemoveExistingMedia,
  removingMediaId = null,
  onRefreshExistingMediaUrl,
  onRetryQueueItem,
  onFilesAddedImmediately,
}: ReviewMediaUploaderProps) {
  const inputId = useId();

  const existingImageCount = existingMedia.filter(
    (item) => item.kind === "image",
  ).length;
  const existingVideoCount = existingMedia.filter(
    (item) => item.kind === "video",
  ).length;

  const queuedImageCount = uploader.queue.filter(
    (item) => item.kind === "image",
  ).length;
  const queuedVideoCount = uploader.queue.filter(
    (item) => item.kind === "video",
  ).length;

  const totalImages = existingImageCount + queuedImageCount;
  const totalVideos = existingVideoCount + queuedVideoCount;
  const canAddMoreImages = totalImages < REVIEW_IMAGE_MAX_COUNT;
  const canAddVideo = videoEnabled && totalVideos < REVIEW_VIDEO_MAX_COUNT;
  const canAcceptMoreFiles = !disabled && (canAddMoreImages || canAddVideo);

  const acceptedMimeTypes = [
    ...(canAddMoreImages ? ["image/jpeg", "image/png", "image/webp"] : []),
    ...(canAddVideo ? ["video/mp4", "video/webm"] : []),
  ].join(",");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) {
      return;
    }

    const added = await uploader.addFiles(
      fileList,
      existingImageCount,
      existingVideoCount,
    );
    event.target.value = "";

    if (added.length > 0 && onFilesAddedImmediately) {
      onFilesAddedImmediately(added);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-ink text-sm font-semibold">
          Photos{videoEnabled ? " & Video" : ""} (Optional)
        </span>
        <span className="text-ink-muted text-xs">
          {totalImages}/{REVIEW_IMAGE_MAX_COUNT} photos
          {videoEnabled
            ? ` · ${totalVideos}/${REVIEW_VIDEO_MAX_COUNT} video`
            : ""}
        </span>
      </div>

      {/* Existing attached media */}
      {existingMedia.length > 0 ? (
        <div className="space-y-2">
          <p className="text-ink-muted text-xs font-medium">
            Attached to your review
          </p>
          <ReviewMediaGallery
            media={existingMedia}
            reviewerLabel="you"
            onRefreshUrl={onRefreshExistingMediaUrl}
            onRemoveMedia={onRemoveExistingMedia}
            removingMediaId={removingMediaId}
            disableRemove={disabled}
          />
        </div>
      ) : null}

      {/* Queued / Uploading / Failed items */}
      {uploader.queue.length > 0 ? (
        <ul className="space-y-2.5" aria-label="Queued review media">
          {uploader.queue.map((item) => {
            const isBusy =
              item.status === "signing" ||
              item.status === "uploading" ||
              item.status === "finalizing";
            const isError = item.status === "error";

            return (
              <li
                key={item.localId}
                className={cn(
                  "border-line bg-surface-subtle flex items-start gap-3 rounded-2xl border p-3",
                  isError && "border-danger-200 bg-danger-50/70",
                )}
              >
                <div className="border-line bg-surface-elevated relative size-14 shrink-0 overflow-hidden rounded-xl border">
                  {item.kind === "image" && item.previewUrl ? (
                    <SignedMediaImage
                      src={item.previewUrl}
                      alt={`Preview of ${item.file.name}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="text-brand-700 grid size-full place-items-center">
                      <Film className="size-6" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-ink truncate text-sm font-semibold">
                        {item.file.name}
                      </p>
                      <p className="text-ink-muted text-xs">
                        {formatFileSize(item.bytes)} ·{" "}
                        {isError
                          ? "Upload failed"
                          : item.status === "uploading"
                            ? `Uploading (${item.progress}%)`
                            : statusLabelMap[item.status]}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {isError && reviewId ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={uploader.isProcessing || disabled}
                          leftIcon={
                            <RefreshCw className="size-3.5" aria-hidden="true" />
                          }
                          onClick={() => {
                            if (onRetryQueueItem) {
                              onRetryQueueItem(item.localId);
                            } else {
                              void uploader.retryItem(
                                item.localId,
                                reviewId,
                                existingMedia.length,
                              );
                            }
                          }}
                        >
                          Retry
                        </Button>
                      ) : null}

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={
                          isBusy
                            ? `Cancel uploading ${item.file.name}`
                            : `Remove ${item.file.name}`
                        }
                        onClick={() =>
                          void uploader.removeItem(item.localId, reviewId)
                        }
                      >
                        <X className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  {isBusy ? (
                    <div className="bg-surface-elevated border-line h-2 w-full overflow-hidden rounded-full border">
                      <div
                        role="progressbar"
                        aria-label={`Upload progress for ${item.file.name}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={item.progress}
                        className="bg-brand-600 h-full rounded-full transition-all duration-150"
                        style={{ width: `${Math.max(4, item.progress)}%` }}
                      />
                    </div>
                  ) : null}

                  {isError && item.errorMessage ? (
                    <p role="alert" className="text-danger-700 text-xs font-medium">
                      {item.errorMessage}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Validation feedback */}
      {uploader.validationErrors.length > 0 ? (
        <DismissibleAlert
          tone="error"
          noticeKey={uploader.validationErrors.join("|")}
          onDismiss={uploader.clearValidationErrors}
        >
          <ul className="list-disc space-y-0.5 pl-4">
            {uploader.validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </DismissibleAlert>
      ) : null}

      {/* Picker label button */}
      {canAcceptMoreFiles ? (
        <label
          htmlFor={inputId}
          className={cn(
            "border-line bg-surface-subtle hover:border-brand-300 hover:bg-brand-50/40 focus-within:ring-brand-500 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-5 text-center transition-colors focus-within:ring-2",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          <span className="bg-brand-50 text-brand-600 grid size-10 place-items-center rounded-xl">
            {uploader.isProcessing ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <UploadCloud className="size-5" aria-hidden="true" />
            )}
          </span>
          <div className="space-y-0.5">
            <p className="text-ink inline-flex items-center gap-1.5 text-sm font-semibold">
              <ImagePlus className="text-brand-600 size-4" aria-hidden="true" />
              <span>
                {videoEnabled ? "Add photos or video" : "Add product photos"}
              </span>
            </p>
            <p className="text-ink-muted text-xs">
              Up to {REVIEW_IMAGE_MAX_COUNT} photos (JPG, PNG, WebP · max 5 MB each)
              {videoEnabled
                ? ` · Up to ${REVIEW_VIDEO_MAX_COUNT} video (MP4, WebM · max 30 MB, ${REVIEW_VIDEO_MAX_DURATION_SECONDS}s)`
                : ""}
            </p>
          </div>
          <input
            id={inputId}
            type="file"
            accept={acceptedMimeTypes}
            multiple
            disabled={disabled}
            onChange={(event) => void handleFileChange(event)}
            className="sr-only"
          />
        </label>
      ) : null}
    </div>
  );
}

