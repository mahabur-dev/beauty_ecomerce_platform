/**
 * Locked media and input constraints mirrored from `backend/config/reviews.php`
 * and `StoreReviewRequest`.
 */
export const REVIEW_TITLE_MAX_LENGTH = 120;
export const REVIEW_BODY_MAX_LENGTH = 4000;
export const REVIEW_DEFAULT_PAGE_SIZE = 10;

export const REVIEW_IMAGE_MAX_COUNT = 5;
export const REVIEW_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const REVIEW_IMAGE_ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
] as const;
export const REVIEW_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const REVIEW_VIDEO_MAX_COUNT = 1;
export const REVIEW_VIDEO_MAX_BYTES = 30 * 1024 * 1024; // 30 MB
export const REVIEW_VIDEO_MAX_DURATION_SECONDS = 30;
export const REVIEW_VIDEO_ALLOWED_FORMATS = ["mp4", "webm"] as const;
export const REVIEW_VIDEO_ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/webm",
] as const;

/**
 * Signed media URLs expire on the backend after 300 seconds; refresh proactively
 * when less than 30 seconds remain.
 */
export const REVIEW_MEDIA_URL_REFRESH_BUFFER_MS = 30_000;

export const REVIEW_SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "highest", label: "Highest rating" },
  { value: "lowest", label: "Lowest rating" },
] as const;

