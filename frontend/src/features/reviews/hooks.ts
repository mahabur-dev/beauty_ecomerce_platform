"use client";

import {
  keepPreviousData,
  useQuery,
  type QueryClient,
} from "@tanstack/react-query";

import {
  getMyProductReview,
  getProductReviews,
  getProductReviewSummary,
} from "./api";
import type { PublicReviewsQueryParams } from "./types";

export const reviewQueryKeys = {
  all: ["reviews"] as const,
  productSummary: (slug: string) =>
    ["reviews", "summary", slug] as const,
  productList: (slug: string, params: PublicReviewsQueryParams = {}) =>
    [
      "reviews",
      "product",
      slug,
      {
        rating: params.rating ?? null,
        withMedia: Boolean(params.withMedia),
        sort: params.sort ?? "newest",
        page: params.page ?? 1,
        perPage: params.perPage ?? 10,
      },
    ] as const,
  productListsRoot: (slug: string) =>
    ["reviews", "product", slug] as const,
  mine: (slug: string) => ["reviews", "mine", slug] as const,
};

export function useProductReviewSummary(slug: string) {
  return useQuery({
    queryKey: reviewQueryKeys.productSummary(slug),
    queryFn: () => getProductReviewSummary(slug),
    enabled: Boolean(slug),
    staleTime: 30_000,
    retry: false,
  });
}

export function useProductReviews(
  slug: string,
  params: PublicReviewsQueryParams,
) {
  return useQuery({
    queryKey: reviewQueryKeys.productList(slug, params),
    queryFn: () => getProductReviews(slug, params),
    enabled: Boolean(slug),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useMyProductReview(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: reviewQueryKeys.mine(slug),
    queryFn: () => getMyProductReview(slug),
    enabled: Boolean(slug) && enabled,
    staleTime: 15_000,
    retry: false,
  });
}

export async function invalidateProductReviewQueries(
  queryClient: QueryClient,
  slug: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: reviewQueryKeys.productSummary(slug),
    }),
    queryClient.invalidateQueries({
      queryKey: reviewQueryKeys.productListsRoot(slug),
    }),
    queryClient.invalidateQueries({
      queryKey: reviewQueryKeys.mine(slug),
    }),
  ]);
}

