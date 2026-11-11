import type { z } from "zod";
import { apiRequest } from "@/lib/api";
import { ApiContractError } from "@/lib/api/errors";
import {
  adminReviewResponseSchema,
  paginatedAdminReviewsSchema,
  reviewProductOptionsResponseSchema,
  reviewReplyResponseSchema,
  type AdminReview,
  type ReviewModerationTarget,
  type ReviewProductOption,
  type ReviewReply,
  type ReviewSort,
  type ReviewStatus,
  type ReviewTrashFilter,
} from "./contracts";

export interface AdminReviewListParams {
  page?: number | undefined;
  perPage?: number | undefined;
  search?: string | undefined;
  status?: ReviewStatus | "all" | undefined;
  rating?: number | "all" | undefined;
  productId?: number | "all" | undefined;
  withMedia?: boolean | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  trash?: ReviewTrashFilter | undefined;
  sort?: ReviewSort | undefined;
}

export interface ModerateAdminReviewInput {
  status: ReviewModerationTarget;
  reason: string;
  lock_version?: number | undefined;
}

export function buildAdminReviewsQueryString(
  params: AdminReviewListParams = {},
): string {
  const query = new URLSearchParams();

  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }
  if (params.perPage) {
    query.set("per_page", String(params.perPage));
  }
  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.rating && params.rating !== "all") {
    query.set("rating", String(params.rating));
  }
  if (params.productId && params.productId !== "all") {
    query.set("product_id", String(params.productId));
  }
  if (params.withMedia) {
    query.set("with_media", "1");
  }
  if (params.dateFrom) {
    query.set("date_from", params.dateFrom);
  }
  if (params.dateTo) {
    query.set("date_to", params.dateTo);
  }
  if (params.trash && params.trash !== "without") {
    query.set("trash", params.trash);
  }
  if (params.sort && params.sort !== "newest") {
    query.set("sort", params.sort);
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

async function contract<T>(
  request: Promise<unknown>,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await request;
  const parsed = schema.safeParse(response);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "Admin reviews API contract validation failed:",
        parsed.error.issues,
        response,
      );
    }
    throw new ApiContractError(parsed.error);
  }
  return parsed.data;
}

export function listAdminReviews(params: AdminReviewListParams = {}) {
  return contract(
    apiRequest(`/admin/reviews${buildAdminReviewsQueryString(params)}`),
    paginatedAdminReviewsSchema,
  );
}

export function getAdminReview(reviewId: number): Promise<AdminReview> {
  return contract(
    apiRequest(`/admin/reviews/${reviewId}`),
    adminReviewResponseSchema,
  ).then((response) => response.data);
}

export function moderateAdminReview(
  reviewId: number,
  input: ModerateAdminReviewInput,
): Promise<AdminReview> {
  return contract(
    apiRequest(`/admin/reviews/${reviewId}/moderate`, {
      method: "POST",
      json: input,
    }),
    adminReviewResponseSchema,
  ).then((response) => response.data);
}

export function createAdminReviewReply(
  reviewId: number,
  body: string,
): Promise<ReviewReply> {
  return contract(
    apiRequest(`/admin/reviews/${reviewId}/reply`, {
      method: "POST",
      json: { body },
    }),
    reviewReplyResponseSchema,
  ).then((response) => response.data);
}

export function updateAdminReviewReply(
  reviewId: number,
  body: string,
): Promise<ReviewReply> {
  return contract(
    apiRequest(`/admin/reviews/${reviewId}/reply`, {
      method: "PATCH",
      json: { body },
    }),
    reviewReplyResponseSchema,
  ).then((response) => response.data);
}

export function deleteAdminReviewReply(reviewId: number): Promise<void> {
  return apiRequest<void>(`/admin/reviews/${reviewId}/reply`, {
    method: "DELETE",
  });
}

export function listReviewProductOptions(): Promise<ReviewProductOption[]> {
  return contract(
    apiRequest("/admin/products?per_page=100"),
    reviewProductOptionsResponseSchema,
  ).then((response) => response.data);
}

