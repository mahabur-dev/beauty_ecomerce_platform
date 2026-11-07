import type { z } from "zod";
import { apiRequest } from "@/lib/api";
import { ApiContractError } from "@/lib/api/errors";
import {
  catalogOptionsResponseSchema,
  catalogSummaryResponseSchema,
  categoryResponseSchema,
  paginatedBrandsSchema,
  paginatedCategoriesSchema,
  paginatedProductsSchema,
  productImageResponseSchema,
  productResponseSchema,
  productVariantResponseSchema,
  type CategoryStatus,
  type ProductStatus,
} from "./contracts";

export interface ListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  categoryId?: number;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description: string | null;
  status: CategoryStatus;
  category_id?: number;
}

export interface ProductInput {
  category_id: number;
  subcategory_id: number;
  brand_id: number | null;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  status: ProductStatus;
  sku: string;
  price: number;
  compare_at_price: number | null;
}

function queryString(params: ListParams): string {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.perPage) query.set("per_page", String(params.perPage));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "all")
    query.set("status", params.status);
  if (params.categoryId) query.set("category_id", String(params.categoryId));
  const value = query.toString();
  return value ? `?${value}` : "";
}

async function contract<T>(
  request: Promise<unknown>,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await request;
  const parsed = schema.safeParse(response);
  if (!parsed.success) throw new ApiContractError(parsed.error);
  return parsed.data;
}

export function listCategories(
  kind: "categories" | "subcategories",
  params: ListParams = {},
) {
  return contract(
    apiRequest(`/admin/${kind}${queryString(params)}`),
    paginatedCategoriesSchema,
  );
}

export function listBrands(params: ListParams = {}) {
  return contract(
    apiRequest(`/admin/brands${queryString(params)}`),
    paginatedBrandsSchema,
  );
}

export function createCategory(
  kind: "categories" | "subcategories",
  input: CategoryInput,
) {
  return contract(
    apiRequest(`/admin/${kind}`, { method: "POST", json: input }),
    categoryResponseSchema,
  ).then((response) => response.data);
}

export function updateCategory(
  kind: "categories" | "subcategories",
  id: number,
  input: CategoryInput,
) {
  return contract(
    apiRequest(`/admin/${kind}/${id}`, { method: "PATCH", json: input }),
    categoryResponseSchema,
  ).then((response) => response.data);
}

export function deleteCategory(
  kind: "categories" | "subcategories",
  id: number,
) {
  return apiRequest<void>(`/admin/${kind}/${id}`, { method: "DELETE" });
}

export function listProducts(params: ListParams = {}) {
  return contract(
    apiRequest(`/admin/products${queryString(params)}`),
    paginatedProductsSchema,
  );
}

export function getCatalogSummary() {
  return contract(
    apiRequest("/admin/catalog/summary"),
    catalogSummaryResponseSchema,
  ).then((response) => response.data);
}

export function getCatalogOptions() {
  return contract(
    apiRequest("/admin/catalog/options"),
    catalogOptionsResponseSchema,
  ).then((response) => response.data);
}

export async function createProduct(input: ProductInput) {
  const payload = {
    category_id: input.category_id,
    subcategory_id: input.subcategory_id,
    brand_id: input.brand_id,
    name: input.name,
    slug: input.slug,
    description: input.description,
    short_description: input.short_description,
    status: "draft",
    variants: [
      {
        sku: input.sku,
        title: "Default",
        price: input.price,
        compare_at_price: input.compare_at_price,
        is_default: true,
        is_active: true,
        attribute_value_ids: [],
      },
    ],
  };
  const response = await contract(
    apiRequest("/admin/products", { method: "POST", json: payload }),
    productResponseSchema,
  );
  return response.data;
}

export async function updateProduct(id: number, input: ProductInput) {
  const response = await contract(
    apiRequest(`/admin/products/${id}`, {
      method: "PATCH",
      json: {
        category_id: input.category_id,
        subcategory_id: input.subcategory_id,
        brand_id: input.brand_id,
        name: input.name,
        slug: input.slug,
        description: input.description,
        short_description: input.short_description,
        status: input.status,
        new_price: input.price,
        old_price: input.compare_at_price,
      },
    }),
    productResponseSchema,
  );
  return response.data;
}

export async function updateProductVariant(
  productId: number,
  variantId: number,
  input: { sku: string; price: number; compare_at_price: number | null },
) {
  const response = await contract(
    apiRequest(`/admin/products/${productId}/variants/${variantId}`, {
      method: "PATCH",
      json: input,
    }),
    productVariantResponseSchema,
  );
  return response.data;
}

export function deleteProduct(id: number) {
  return apiRequest<void>(`/admin/products/${id}`, { method: "DELETE" });
}

export async function uploadProductImage(
  productId: number,
  image: File,
  name: string,
) {
  const body = new FormData();
  body.set("image", image);
  body.set("alt_text", name);
  body.set("is_primary", "1");
  const response = await contract(
    apiRequest(`/admin/products/${productId}/images`, { method: "POST", body }),
    productImageResponseSchema,
  );
  return response.data;
}

export async function setProductStatus(id: number, status: ProductStatus) {
  const response = await contract(
    apiRequest(`/admin/products/${id}`, { method: "PATCH", json: { status } }),
    productResponseSchema,
  );
  return response.data;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
