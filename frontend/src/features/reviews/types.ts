import type { PaginatedResponse } from "@/types/api";

export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";
export type ReviewMediaKind = "image" | "video";
export type ReviewMediaStatus = "ready" | "rejected";
export type ReviewSort = "newest" | "highest" | "lowest";

export type RatingStarsKey = "5" | "4" | "3" | "2" | "1";

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  distribution: Record<RatingStarsKey, number>;
}

export interface ReviewMediaItem {
  id: number;
  review_id: number;
  kind: ReviewMediaKind;
  format: string;
  mime_type: string;
  bytes: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  sort_order: number;
  status: ReviewMediaStatus;
  url: string;
  url_expires_at: string;
  created_at: string | null;
}

export interface ReviewReply {
  id: number;
  body: string;
  author_name: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface PublicReview {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  verified_purchase: boolean;
  published_at: string | null;
  author: {
    name: string;
  };
  media: ReviewMediaItem[];
  reply: ReviewReply | null;
}

export interface PublicReviewsResponse extends PaginatedResponse<PublicReview> {
  summary: ReviewSummary;
}

export interface OwnReviewProductRef {
  id: number;
  name: string;
  slug: string;
}

export interface OwnReview {
  id: number;
  product_id: number;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  verified_purchase: boolean;
  moderation_reason: string | null;
  lock_version: number;
  submitted_at: string | null;
  published_at: string | null;
  moderated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  product?: OwnReviewProductRef | null;
  media: ReviewMediaItem[];
  reply: ReviewReply | null;
}

export interface ReviewUploadIntent {
  intent_token: string;
  kind: ReviewMediaKind;
  expires_at: string;
  max_bytes: number;
  allowed_formats: string[];
  upload: {
    url: string;
    method: string;
    fields: Record<string, string | number>;
  };
}

export interface PublicReviewsQueryParams {
  rating?: number | null;
  withMedia?: boolean;
  sort?: ReviewSort;
  page?: number;
  perPage?: number;
}

export interface CreateReviewInput {
  rating: number;
  title?: string | null;
  body?: string | null;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string | null;
  body?: string | null;
  lock_version?: number;
}

export interface CreateReviewMediaIntentInput {
  kind: ReviewMediaKind;
  format: string;
  mime_type: string;
  bytes: number;
  duration_seconds?: number | null;
}

export type MediaQueueStatus =
  | "queued"
  | "signing"
  | "uploading"
  | "finalizing"
  | "uploaded"
  | "error";

export interface MediaUploadQueueItem {
  localId: string;
  file: File;
  kind: ReviewMediaKind;
  format: string;
  mimeType: string;
  bytes: number;
  previewUrl: string;
  durationSeconds: number | null;
  status: MediaQueueStatus;
  progress: number;
  intentToken: string | null;
  errorMessage: string | null;
}

