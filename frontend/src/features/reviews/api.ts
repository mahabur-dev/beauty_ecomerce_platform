import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";

import { REVIEW_DEFAULT_PAGE_SIZE } from "./constants";
import type {
  CreateReviewInput,
  CreateReviewMediaIntentInput,
  OwnReview,
  PublicReviewsQueryParams,
  PublicReviewsResponse,
  ReviewMediaItem,
  ReviewSummary,
  ReviewUploadIntent,
  UpdateReviewInput,
} from "./types";

const publicGetOptions = { cache: "no-store" } as const;

function readBrowserCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  const prefix = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined;
}

function getMutationHeaders(): Record<string, string> {
  const csrfToken = readBrowserCookie("XSRF-TOKEN");

  return csrfToken
    ? {
        "X-Requested-With": "XMLHttpRequest",
        "X-XSRF-TOKEN": csrfToken,
      }
    : {
        "X-Requested-With": "XMLHttpRequest",
      };
}

export function buildPublicReviewsQueryString(
  query: PublicReviewsQueryParams = {},
): string {
  const params = new URLSearchParams();

  if (query.rating && query.rating >= 1 && query.rating <= 5) {
    params.set("rating", String(query.rating));
  }

  if (query.withMedia) {
    params.set("with_media", "1");
  }

  if (query.sort) {
    params.set("sort", query.sort);
  }

  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }

  params.set(
    "per_page",
    String(query.perPage ?? REVIEW_DEFAULT_PAGE_SIZE),
  );

  return params.toString();
}

export function getProductReviews(
  slug: string,
  query: PublicReviewsQueryParams = {},
): Promise<PublicReviewsResponse> {
  const queryString = buildPublicReviewsQueryString(query);
  return apiRequest<PublicReviewsResponse>(
    `/products/${encodeURIComponent(slug)}/reviews?${queryString}`,
    publicGetOptions,
  );
}

export async function getProductReviewSummary(
  slug: string,
): Promise<ReviewSummary> {
  const response = await apiRequest<{ data: ReviewSummary }>(
    `/products/${encodeURIComponent(slug)}/reviews/summary`,
    publicGetOptions,
  );

  return response.data;
}

export async function getMyProductReview(
  slug: string,
): Promise<OwnReview | null> {
  const params = new URLSearchParams({
    product_slug: slug,
    per_page: "1",
  });

  try {
    const response = await apiRequest<PaginatedResponse<OwnReview>>(
      `/reviews/me?${params.toString()}`,
      { cache: "no-store" },
    );

    return response.data[0] ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export async function getMyReviewById(reviewId: number): Promise<OwnReview> {
  const response = await apiRequest<{ data: OwnReview }>(
    `/reviews/${reviewId}`,
    { cache: "no-store" },
  );

  return response.data;
}

export async function createProductReview(
  slug: string,
  input: CreateReviewInput,
): Promise<OwnReview> {
  const response = await apiRequest<{ data: OwnReview }>(
    `/products/${encodeURIComponent(slug)}/reviews`,
    {
      method: "POST",
      headers: getMutationHeaders(),
      json: input,
    },
  );

  return response.data;
}

export async function updateProductReview(
  reviewId: number,
  input: UpdateReviewInput,
): Promise<OwnReview> {
  const response = await apiRequest<{ data: OwnReview }>(
    `/reviews/${reviewId}`,
    {
      method: "PATCH",
      headers: getMutationHeaders(),
      json: input,
    },
  );

  return response.data;
}

export async function deleteProductReview(reviewId: number): Promise<void> {
  await apiRequest<void>(`/reviews/${reviewId}`, {
    method: "DELETE",
    headers: getMutationHeaders(),
  });
}

export async function createReviewMediaIntent(
  reviewId: number,
  input: CreateReviewMediaIntentInput,
): Promise<ReviewUploadIntent> {
  const response = await apiRequest<{ data: ReviewUploadIntent }>(
    `/reviews/${reviewId}/media/intents`,
    {
      method: "POST",
      headers: getMutationHeaders(),
      json: input,
    },
  );

  return response.data;
}

export async function cancelReviewMediaIntent(
  reviewId: number,
  token: string,
): Promise<void> {
  await apiRequest<void>(
    `/reviews/${reviewId}/media/intents/${encodeURIComponent(token)}`,
    {
      method: "DELETE",
      headers: getMutationHeaders(),
    },
  );
}

export interface SignedUploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/**
 * Uploads the selected file directly to Cloudinary using signed form parameters.
 * Uses XMLHttpRequest so upload progress and explicit cancellation work reliably.
 */
export function uploadMediaToCloudinarySigned(
  upload: ReviewUploadIntent["upload"],
  file: File,
  options: SignedUploadOptions = {},
): Promise<void> {
  const { onProgress, signal } = options;

  if (signal?.aborted) {
    return Promise.reject(new DOMException("Upload cancelled.", "AbortError"));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    for (const [key, value] of Object.entries(upload.fields)) {
      formData.append(key, String(value));
    }
    formData.append("file", file);

    const handleAbort = () => {
      xhr.abort();
      reject(new DOMException("Upload cancelled.", "AbortError"));
    };

    if (signal) {
      signal.addEventListener("abort", handleAbort, { once: true });
    }

    const cleanup = () => {
      if (signal) {
        signal.removeEventListener("abort", handleAbort);
      }
    };

    xhr.open(upload.method.toUpperCase(), upload.url, true);
    xhr.withCredentials = false;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) {
        return;
      }

      const percent = Math.min(
        99,
        Math.max(1, Math.round((event.loaded / event.total) * 100)),
      );
      onProgress?.(percent);
    };

    xhr.onload = () => {
      cleanup();

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      let message = `Media upload failed (${xhr.status}). Please retry.`;
      try {
        const parsed = JSON.parse(xhr.responseText) as {
          error?: { message?: string };
        };
        if (parsed?.error?.message) {
          message = parsed.error.message;
        }
      } catch {
        // Non-JSON response body from storage provider; keep fallback error message.
      }

      reject(new Error(message));
    };

    xhr.onerror = () => {
      cleanup();
      reject(
        new Error(
          "Cloud upload failed due to a network error. Please try again.",
        ),
      );
    };

    xhr.onabort = () => {
      cleanup();
      reject(new DOMException("Upload cancelled.", "AbortError"));
    };

    xhr.send(formData);
  });
}

export async function finalizeReviewMedia(
  reviewId: number,
  payload: { token: string; sort_order?: number },
): Promise<ReviewMediaItem> {
  const response = await apiRequest<{ data: ReviewMediaItem }>(
    `/reviews/${reviewId}/media/finalize`,
    {
      method: "POST",
      headers: getMutationHeaders(),
      json: payload,
    },
  );

  return response.data;
}

export async function refreshReviewMediaUrl(
  reviewId: number,
  mediaId: number,
): Promise<ReviewMediaItem> {
  const response = await apiRequest<{ data: ReviewMediaItem }>(
    `/reviews/${reviewId}/media/${mediaId}/url`,
    { cache: "no-store" },
  );

  return response.data;
}

export async function deleteReviewMedia(
  reviewId: number,
  mediaId: number,
): Promise<void> {
  await apiRequest<void>(`/reviews/${reviewId}/media/${mediaId}`, {
    method: "DELETE",
    headers: getMutationHeaders(),
  });
}

