import type { PaginatedResponse, PaginationMeta } from "@/types/api";

export type CatalogSort = "newest" | "price_asc" | "price_desc" | "name";

export interface CatalogQuery {
  search?: string | undefined;
  category?: string | undefined;
  subcategory?: string | undefined;
  subcategories?: string[] | undefined;
  brand?: string | undefined;
  brands?: string[] | undefined;
  attributeValueIds?: number[] | undefined;
  minPrice?: string | undefined;
  maxPrice?: string | undefined;
  sort: CatalogSort;
  page: number;
  perPage: number;
}

export interface CatalogCategory {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  parent?: Pick<CatalogCategory, "id" | "name" | "slug"> | null;
  subcategories?: CatalogCategory[];
}

export interface CatalogBrand {
  id: number;
  name: string;
  slug: string;
}

export interface CatalogImage {
  id: number;
  variant_id: number | null;
  url: string;
  format: string | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  is_primary: boolean;
}

export interface CatalogProduct {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  new_price: string | null;
  old_price: string | null;
  brand: Omit<CatalogBrand, "id"> | null;
  category: Pick<CatalogCategory, "name" | "slug"> | null;
  subcategory: Pick<CatalogCategory, "name" | "slug"> | null;
  primary_image: CatalogImage | null;
}

export interface CatalogProductVariant {
  id: number;
  sku: string;
  title: string;
  price: string;
  compare_at_price: string | null;
  is_default: boolean;
  stock_quantity?: number;
  attribute_values?: CatalogAttributeValue[];
}

export interface CatalogProductDetail extends CatalogProduct {
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  variants: CatalogProductVariant[];
  images: CatalogImage[];
}

export interface CatalogAttributeValue {
  id: number;
  value: string;
  code: string;
}

export interface CatalogAttribute {
  id: number;
  name: string;
  code: string;
  values: CatalogAttributeValue[];
}

export interface CatalogFacets {
  brands: CatalogBrand[];
  attributes: CatalogAttribute[];
}

export interface CatalogGroup {
  subcategory: CatalogCategory;
  products: CatalogProduct[];
}

export interface GroupedCatalogResponse extends PaginatedResponse<CatalogGroup> {
  meta: PaginationMeta & { products_per_group: number };
}

export interface ResourceResponse<T> {
  data: T;
}

export type CatalogSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;
