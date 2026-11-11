import { z } from "zod";

import {
  REVIEW_BODY_MAX_LENGTH,
  REVIEW_IMAGE_MAX_BYTES,
  REVIEW_IMAGE_MAX_COUNT,
  REVIEW_VIDEO_MAX_BYTES,
  REVIEW_VIDEO_MAX_COUNT,
  REVIEW_VIDEO_MAX_DURATION_SECONDS,
} from "./constants";
import type { ReviewMediaKind } from "./types";

export const reviewFormSchema = z.object({
  rating: z
    .number({ message: "Please select a star rating." })
    .int("Rating must be a whole star between 1 and 5.")
    .min(1, "Please select at least 1 star.")
    .max(5, "Rating cannot exceed 5 stars."),
  body: z
    .string()
    .trim()
    .min(1, "Please write your review before submitting.")
    .max(
      REVIEW_BODY_MAX_LENGTH,
      `Review text cannot exceed ${REVIEW_BODY_MAX_LENGTH} characters.`,
    ),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export interface ReviewFieldErrors {
  rating?: string | undefined;
  body?: string | undefined;
}

export function extractZodReviewErrors(
  error: z.ZodError<ReviewFormValues>,
): ReviewFieldErrors {
  const flattened = error.flatten().fieldErrors;

  return {
    rating: flattened.rating?.[0],
    body: flattened.body?.[0],
  };
}

interface MediaFormatRule {
  kind: ReviewMediaKind;
  mimeType: string;
}

const FORMAT_TO_RULE: Record<string, MediaFormatRule> = {
  jpg: { kind: "image", mimeType: "image/jpeg" },
  jpeg: { kind: "image", mimeType: "image/jpeg" },
  png: { kind: "image", mimeType: "image/png" },
  webp: { kind: "image", mimeType: "image/webp" },
  mp4: { kind: "video", mimeType: "video/mp4" },
  webm: { kind: "video", mimeType: "video/webm" },
};

const MIME_TO_DEFAULT_FORMAT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export type MediaFileResolution =
  | {
      ok: true;
      kind: ReviewMediaKind;
      format: string;
      mimeType: string;
    }
  | {
      ok: false;
      error: string;
    };

function normalizeMime(mime: string): string {
  return mime.split(";")[0]?.trim().toLowerCase() ?? "";
}

function fileExtension(fileName: string): string | null {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === fileName.length - 1) {
    return null;
  }

  return fileName.slice(dotIndex + 1).trim().toLowerCase();
}

export function resolveMediaFileDescriptor(file: File): MediaFileResolution {
  const normalizedMime = normalizeMime(file.type);
  const ext = fileExtension(file.name);

  if (ext) {
    const extRule = FORMAT_TO_RULE[ext];
    if (!extRule) {
      return {
        ok: false,
        error: `Unsupported file type ".${ext}". Allowed photos: JPG, PNG, WebP. Allowed videos: MP4, WebM.`,
      };
    }

    if (normalizedMime && normalizedMime !== extRule.mimeType) {
      return {
        ok: false,
        error: `File "${file.name}" does not match its declared MIME type (${normalizedMime}).`,
      };
    }

    return {
      ok: true,
      kind: extRule.kind,
      format: ext,
      mimeType: extRule.mimeType,
    };
  }

  const fallbackFormat = MIME_TO_DEFAULT_FORMAT[normalizedMime];
  if (!fallbackFormat) {
    return {
      ok: false,
      error:
        "Unsupported media format. Allowed photos: JPG, PNG, WebP. Allowed videos: MP4, WebM.",
    };
  }

  const fallbackRule = FORMAT_TO_RULE[fallbackFormat]!;
  return {
    ok: true,
    kind: fallbackRule.kind,
    format: fallbackFormat,
    mimeType: fallbackRule.mimeType,
  };
}

/**
 * Extracts video duration in seconds using a detached browser `<video>` element.
 * Returns `null` safely if metadata decoding is unsupported (e.g. headless DOM tests).
 */
export function readVideoDurationSeconds(file: File): Promise<number | null> {
  if (
    typeof document === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;

    const finish = (duration: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };

    const timeoutId = setTimeout(() => finish(null), 1500);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.round(video.duration * 100) / 100
          : null;
      finish(duration);
    };
    video.onerror = () => finish(null);
    video.src = objectUrl;
  });
}

export interface ValidateMediaCandidateOptions {
  file: File;
  existingImageCount: number;
  existingVideoCount: number;
  videoEnabled: boolean;
  durationSeconds?: number | null;
}

export function validateMediaFileCandidate({
  file,
  existingImageCount,
  existingVideoCount,
  videoEnabled,
  durationSeconds = null,
}: ValidateMediaCandidateOptions): MediaFileResolution {
  const descriptor = resolveMediaFileDescriptor(file);
  if (!descriptor.ok) {
    return descriptor;
  }

  if (file.size < 1) {
    return {
      ok: false,
      error: `"${file.name}" is empty and cannot be uploaded.`,
    };
  }

  if (descriptor.kind === "video") {
    if (!videoEnabled) {
      return {
        ok: false,
        error: "Video uploads are currently disabled.",
      };
    }

    if (existingVideoCount >= REVIEW_VIDEO_MAX_COUNT) {
      return {
        ok: false,
        error: `You can attach at most ${REVIEW_VIDEO_MAX_COUNT} video per review.`,
      };
    }

    if (file.size > REVIEW_VIDEO_MAX_BYTES) {
      return {
        ok: false,
        error: `"${file.name}" exceeds the 30 MB video limit.`,
      };
    }

    if (
      durationSeconds !== null &&
      (durationSeconds <= 0 ||
        durationSeconds > REVIEW_VIDEO_MAX_DURATION_SECONDS)
    ) {
      return {
        ok: false,
        error: `"${file.name}" exceeds the ${REVIEW_VIDEO_MAX_DURATION_SECONDS}-second video limit.`,
      };
    }

    return descriptor;
  }

  if (existingImageCount >= REVIEW_IMAGE_MAX_COUNT) {
    return {
      ok: false,
      error: `You can attach at most ${REVIEW_IMAGE_MAX_COUNT} photos per review.`,
    };
  }

  if (file.size > REVIEW_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      error: `"${file.name}" exceeds the 5 MB image size limit.`,
    };
  }

  return descriptor;
}

