"use client";

import {
  keepPreviousData,
  useQuery,
  type QueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getCatalogOptions,
  getCatalogSummary,
  listCategories,
  listProducts,
  type ListParams,
} from "./api";

export const catalogKeys = {
  all: ["catalog"] as const,
  summary: () => [...catalogKeys.all, "summary"] as const,
  options: () => [...catalogKeys.all, "options"] as const,
  categoryLists: (kind: "categories" | "subcategories") =>
    [...catalogKeys.all, kind] as const,
  categories: (kind: "categories" | "subcategories", params: ListParams) =>
    [...catalogKeys.categoryLists(kind), params] as const,
  productLists: () => [...catalogKeys.all, "products"] as const,
  products: (params: ListParams) =>
    [...catalogKeys.productLists(), params] as const,
};

export function useCategories(
  kind: "categories" | "subcategories",
  params: ListParams,
) {
  return useQuery({
    queryKey: catalogKeys.categories(kind, params),
    queryFn: () => listCategories(kind, params),
    placeholderData: keepPreviousData,
  });
}

export function useProducts(params: ListParams) {
  return useQuery({
    queryKey: catalogKeys.products(params),
    queryFn: () => listProducts(params),
    placeholderData: keepPreviousData,
  });
}

export function useCatalogSummary() {
  return useQuery({
    queryKey: catalogKeys.summary(),
    queryFn: getCatalogSummary,
    staleTime: 60_000,
  });
}

export function useCatalogOptions() {
  return useQuery({
    queryKey: catalogKeys.options(),
    queryFn: getCatalogOptions,
    staleTime: 60_000,
  });
}

export async function invalidateProductCatalog(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: catalogKeys.productLists() }),
    queryClient.invalidateQueries({ queryKey: catalogKeys.summary() }),
  ]);
}

export async function invalidateCategoryCatalog(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: catalogKeys.categoryLists("categories"),
    }),
    queryClient.invalidateQueries({
      queryKey: catalogKeys.categoryLists("subcategories"),
    }),
    queryClient.invalidateQueries({ queryKey: catalogKeys.options() }),
    queryClient.invalidateQueries({ queryKey: catalogKeys.summary() }),
    queryClient.invalidateQueries({ queryKey: catalogKeys.productLists() }),
  ]);
}

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}
