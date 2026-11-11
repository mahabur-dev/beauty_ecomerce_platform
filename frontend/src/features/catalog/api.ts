import { apiRequest } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogFacets,
  CatalogProduct,
  CatalogProductDetail,
  CatalogQuery,
  GroupedCatalogResponse,
  ResourceResponse,
} from "@/features/catalog/types";
import { catalogQueryString } from "@/features/catalog/query";

const publicRequestOptions = { cache: "no-store" } as const;

export function getProducts(
  query: CatalogQuery,
): Promise<PaginatedResponse<CatalogProduct>> {
  return apiRequest(
    `/products?${catalogQueryString(query)}`,
    publicRequestOptions,
  );
}

export function getProduct(
  slug: string,
): Promise<ResourceResponse<CatalogProductDetail>> {
  return apiRequest(
    `/products/${encodeURIComponent(slug)}`,
    publicRequestOptions,
  );
}

export function getCategories(
  page = 1,
): Promise<PaginatedResponse<CatalogCategory>> {
  const path =
    page > 1 ? `/categories?per_page=100&page=${page}` : "/categories?per_page=100";
  return apiRequest(path, publicRequestOptions);
}

export function getCategory(
  slug: string,
): Promise<ResourceResponse<CatalogCategory>> {
  return apiRequest(
    `/categories/${encodeURIComponent(slug)}`,
    publicRequestOptions,
  );
}

export function getBrands(): Promise<PaginatedResponse<CatalogBrand>> {
  return apiRequest("/brands?per_page=100", publicRequestOptions);
}

export function getBrand(
  slug: string,
): Promise<ResourceResponse<CatalogBrand>> {
  return apiRequest(
    `/brands/${encodeURIComponent(slug)}`,
    publicRequestOptions,
  );
}

export function getFacets(): Promise<ResourceResponse<CatalogFacets>> {
  return apiRequest("/catalog/facets", publicRequestOptions);
}

export function getGroupedCatalog(
  category?: string,
  page = 1,
): Promise<GroupedCatalogResponse> {
  const params = new URLSearchParams({ groups_per_page: "10" });
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));

  return apiRequest(`/catalog/grouped?${params}`, publicRequestOptions);
}
