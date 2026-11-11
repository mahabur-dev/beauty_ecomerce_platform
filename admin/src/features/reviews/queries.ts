"use client";

import {
  keepPreviousData,
  useQuery,
  type QueryClient,
} from "@tanstack/react-query";

import {
  getAdminReview,
  listAdminReviews,
  listReviewProductOptions,
  type AdminReviewListParams,
} from "./api";

export const reviewKeys = {
  all: ["admin", "reviews"] as const,
  lists: () => [...reviewKeys.all, "list"] as const,
  list: (params: AdminReviewListParams) =>
    [...reviewKeys.lists(), params] as const,
  details: () => [...reviewKeys.all, "detail"] as const,
  detail: (reviewId: number) => [...reviewKeys.details(), reviewId] as const,
  productOptions: () => [...reviewKeys.all, "product-options"] as const,
};

export function useAdminReviews(params: AdminReviewListParams) {
  return useQuery({
    queryKey: reviewKeys.list(params),
    queryFn: () => listAdminReviews(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminReviewDetail(reviewId: number | null) {
  return useQuery({
    queryKey:
      reviewId !== null
        ? reviewKeys.detail(reviewId)
        : ([...reviewKeys.details(), "none"] as const),
    queryFn: () => getAdminReview(reviewId!),
    enabled: reviewId !== null,
    staleTime: 10_000,
    retry: false,
  });
}

export function useReviewProductOptions() {
  return useQuery({
    queryKey: reviewKeys.productOptions(),
    queryFn: listReviewProductOptions,
    staleTime: 60_000,
    retry: false,
  });
}

export async function invalidateAdminReviews(
  queryClient: QueryClient,
  reviewId?: number,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: reviewKeys.lists() }),
    ...(reviewId !== undefined
      ? [
          queryClient.invalidateQueries({
            queryKey: reviewKeys.detail(reviewId),
          }),
        ]
      : []),
  ]);
}

