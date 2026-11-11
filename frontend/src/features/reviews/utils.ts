import { REVIEW_MEDIA_URL_REFRESH_BUFFER_MS } from "./constants";
import type { OwnReview, PublicReview, ReviewSummary } from "./types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatReviewDate(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return "";
  }

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return dateFormatter.format(parsed);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isMediaUrlExpiringSoon(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) {
    return false;
  }

  const expiryMs = Date.parse(expiresAt);
  if (Number.isNaN(expiryMs)) {
    return false;
  }

  return expiryMs - Date.now() <= REVIEW_MEDIA_URL_REFRESH_BUFFER_MS;
}

export const EMPTY_REVIEW_SUMMARY: ReviewSummary = {
  average_rating: 0,
  total_reviews: 0,
  distribution: {
    "5": 0,
    "4": 0,
    "3": 0,
    "2": 0,
    "1": 0,
  },
};

/** Maps the authenticated customer's OwnReview payload into PublicReview shape for unified list rendering. */
export function toPublicReviewShape(
  ownReview: OwnReview,
  authorName: string,
): PublicReview {
  return {
    id: ownReview.id,
    rating: ownReview.rating,
    title: ownReview.title,
    body: ownReview.body,
    verified_purchase: ownReview.verified_purchase,
    published_at:
      ownReview.published_at ?? ownReview.submitted_at ?? ownReview.created_at,
    author: {
      name: authorName || "You",
    },
    media: ownReview.media,
    reply: ownReview.reply,
  };
}

