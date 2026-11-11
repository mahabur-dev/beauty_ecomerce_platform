"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { env } from "@/config/env";

import {
  cancelReviewMediaIntent,
  createReviewMediaIntent,
  finalizeReviewMedia,
  uploadMediaToCloudinarySigned,
} from "../api";
import { getReviewErrorMessage } from "../errors";
import {
  readVideoDurationSeconds,
  validateMediaFileCandidate,
} from "../schemas";
import type { MediaUploadQueueItem, ReviewMediaItem } from "../types";

export interface UseMediaUploadQueueOptions {
  videoEnabled?: boolean;
  onMediaUploaded?: (media: ReviewMediaItem) => void;
}

export interface UploadBatchResult {
  uploaded: ReviewMediaItem[];
  failedCount: number;
  firstError: string | null;
}

function createLocalMediaId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createObjectPreviewUrl(file: File): string {
  if (typeof URL.createObjectURL !== "function") {
    return "";
  }

  return URL.createObjectURL(file);
}

function revokeObjectPreviewUrl(previewUrl: string): void {
  if (previewUrl && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(previewUrl);
  }
}

export function useMediaUploadQueue({
  videoEnabled = env.reviewVideoEnabled,
  onMediaUploaded,
}: UseMediaUploadQueueOptions = {}) {
  const [queue, setQueue] = useState<MediaUploadQueueItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const queueRef = useRef<MediaUploadQueueItem[]>([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const removedIdsRef = useRef<Set<string>>(new Set());

  const syncQueue = useCallback(
    (
      updater: (prev: MediaUploadQueueItem[]) => MediaUploadQueueItem[],
    ): void => {
      setQueue((prev) => {
        const next = updater(prev);
        queueRef.current = next;
        return next;
      });
    },
    [],
  );

  const patchItem = useCallback(
    (localId: string, patch: Partial<MediaUploadQueueItem>): void => {
      syncQueue((prev) =>
        prev.map((item) =>
          item.localId === localId ? { ...item, ...patch } : item,
        ),
      );
    },
    [syncQueue],
  );

  useEffect(() => {
    const controllers = abortControllersRef.current;

    return () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      queueRef.current.forEach((item) =>
        revokeObjectPreviewUrl(item.previewUrl),
      );
    };
  }, []);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  const addFiles = useCallback(
    async (
      files: File[] | FileList,
      existingImageCount: number,
      existingVideoCount: number,
    ): Promise<MediaUploadQueueItem[]> => {
      const candidates = Array.from(files);
      if (candidates.length === 0) {
        return [];
      }

      const currentItems = queueRef.current;
      let imageCount =
        existingImageCount +
        currentItems.filter((item) => item.kind === "image").length;
      let videoCount =
        existingVideoCount +
        currentItems.filter((item) => item.kind === "video").length;

      const added: MediaUploadQueueItem[] = [];
      const errors: string[] = [];

      for (const file of candidates) {
        const isVideoCandidate = file.type.toLowerCase().startsWith("video/");
        const durationSeconds = isVideoCandidate
          ? await readVideoDurationSeconds(file)
          : null;

        const verdict = validateMediaFileCandidate({
          file,
          existingImageCount: imageCount,
          existingVideoCount: videoCount,
          videoEnabled,
          durationSeconds,
        });

        if (!verdict.ok) {
          errors.push(verdict.error);
          continue;
        }

        const item: MediaUploadQueueItem = {
          localId: createLocalMediaId(),
          file,
          kind: verdict.kind,
          format: verdict.format,
          mimeType: verdict.mimeType,
          bytes: file.size,
          previewUrl:
            verdict.kind === "image" ? createObjectPreviewUrl(file) : "",
          durationSeconds,
          status: "queued",
          progress: 0,
          intentToken: null,
          errorMessage: null,
        };

        if (verdict.kind === "image") {
          imageCount += 1;
        } else {
          videoCount += 1;
        }

        added.push(item);
      }

      if (added.length > 0) {
        syncQueue((prev) => [...prev, ...added]);
      }

      setValidationErrors(errors);
      return added;
    },
    [syncQueue, videoEnabled],
  );

  const uploadSingleItem = useCallback(
    async (
      item: MediaUploadQueueItem,
      reviewId: number,
      sortOrder: number,
    ): Promise<{ ok: true; media: ReviewMediaItem } | { ok: false; error: string | null }> => {
      removedIdsRef.current.delete(item.localId);
      let activeIntentToken: string | null = null;

      try {
        patchItem(item.localId, {
          status: "signing",
          progress: 0,
          errorMessage: null,
        });

        const intent = await createReviewMediaIntent(reviewId, {
          kind: item.kind,
          format: item.format,
          mime_type: item.mimeType,
          bytes: item.bytes,
          duration_seconds: item.durationSeconds,
        });

        activeIntentToken = intent.intent_token;

        if (removedIdsRef.current.has(item.localId)) {
          await cancelReviewMediaIntent(reviewId, activeIntentToken).catch(
            () => undefined,
          );
          return { ok: false, error: null };
        }

        const controller = new AbortController();
        abortControllersRef.current.set(item.localId, controller);

        patchItem(item.localId, {
          intentToken: intent.intent_token,
          status: "uploading",
          progress: 5,
        });

        await uploadMediaToCloudinarySigned(intent.upload, item.file, {
          signal: controller.signal,
          onProgress: (percent) => {
            patchItem(item.localId, { progress: percent });
          },
        });

        patchItem(item.localId, {
          status: "finalizing",
          progress: 100,
        });

        const media = await finalizeReviewMedia(reviewId, {
          token: intent.intent_token,
          sort_order: sortOrder,
        });

        abortControllersRef.current.delete(item.localId);
        revokeObjectPreviewUrl(item.previewUrl);
        syncQueue((prev) =>
          prev.filter((entry) => entry.localId !== item.localId),
        );
        onMediaUploaded?.(media);

        return { ok: true, media };
      } catch (error) {
        abortControllersRef.current.delete(item.localId);

        if (activeIntentToken) {
          await cancelReviewMediaIntent(reviewId, activeIntentToken).catch(
            () => undefined,
          );
        }

        if (
          removedIdsRef.current.has(item.localId) ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return { ok: false, error: null };
        }

        const message = getReviewErrorMessage(error);
        patchItem(item.localId, {
          status: "error",
          progress: 0,
          intentToken: null,
          errorMessage: message,
        });

        return { ok: false, error: message };
      }
    },
    [onMediaUploaded, patchItem, syncQueue],
  );

  const uploadItemsForReview = useCallback(
    async (
      reviewId: number,
      initialExistingCount: number,
      targetLocalIds?: string[],
    ): Promise<UploadBatchResult> => {
      const targets = queueRef.current.filter((item) => {
        if (targetLocalIds && !targetLocalIds.includes(item.localId)) {
          return false;
        }
        return item.status === "queued" || item.status === "error";
      });

      if (targets.length === 0) {
        return { uploaded: [], failedCount: 0, firstError: null };
      }

      setIsProcessing(true);
      const uploaded: ReviewMediaItem[] = [];
      let failedCount = 0;
      let firstError: string | null = null;
      let nextSortOrder = initialExistingCount;

      try {
        for (const item of targets) {
          if (removedIdsRef.current.has(item.localId)) {
            continue;
          }

          const result = await uploadSingleItem(item, reviewId, nextSortOrder);
          if (result.ok) {
            uploaded.push(result.media);
            nextSortOrder += 1;
          } else if (result.error !== null) {
            failedCount += 1;
            firstError ??= result.error;
          }
        }
      } finally {
        setIsProcessing(false);
      }

      return { uploaded, failedCount, firstError };
    },
    [uploadSingleItem],
  );

  const retryItem = useCallback(
    async (
      localId: string,
      reviewId: number,
      existingMediaCount: number,
    ): Promise<{ ok: boolean; error: string | null }> => {
      const target = queueRef.current.find((item) => item.localId === localId);
      if (!target) {
        return { ok: false, error: null };
      }

      setIsProcessing(true);
      try {
        const result = await uploadSingleItem(
          target,
          reviewId,
          existingMediaCount,
        );
        return result.ok
          ? { ok: true, error: null }
          : { ok: false, error: result.error };
      } finally {
        setIsProcessing(false);
      }
    },
    [uploadSingleItem],
  );

  const removeItem = useCallback(
    async (localId: string, reviewId?: number | null): Promise<void> => {
      removedIdsRef.current.add(localId);

      const target = queueRef.current.find((item) => item.localId === localId);
      const controller = abortControllersRef.current.get(localId);

      if (controller) {
        controller.abort();
        abortControllersRef.current.delete(localId);
      }

      if (target) {
        revokeObjectPreviewUrl(target.previewUrl);
        if (reviewId && target.intentToken) {
          await cancelReviewMediaIntent(reviewId, target.intentToken).catch(
            () => undefined,
          );
        }
      }

      syncQueue((prev) => prev.filter((item) => item.localId !== localId));
    },
    [syncQueue],
  );

  const resetQueue = useCallback(() => {
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();
    queueRef.current.forEach((item) =>
      revokeObjectPreviewUrl(item.previewUrl),
    );
    removedIdsRef.current.clear();
    setValidationErrors([]);
    syncQueue(() => []);
  }, [syncQueue]);

  return {
    queue,
    validationErrors,
    isProcessing,
    clearValidationErrors,
    addFiles,
    uploadItemsForReview,
    retryItem,
    removeItem,
    resetQueue,
  };
}

export type MediaUploadQueueController = ReturnType<typeof useMediaUploadQueue>;

