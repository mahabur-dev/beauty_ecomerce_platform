import { z } from "zod";

export const categoryStatusSchema = z.enum(["active", "inactive"]);
export const productStatusSchema = z.enum(["draft", "active", "inactive"]);

const nullableString = z.string().nullable();
const categorySummarySchema = z.object({
  id: z.number().int().positive(),
  parent_id: z.number().int().positive().nullable(),
  name: z.string(),
  slug: z.string(),
  description: nullableString,
  status: categoryStatusSchema,
  sort_order: z.number().int().nonnegative(),
  children_count: z.number().int().nonnegative().optional(),
  products_count: z.number().int().nonnegative().optional(),
  deleted_at: nullableString,
  created_at: nullableString,
  updated_at: nullableString,
});

export const categorySchema = categorySummarySchema.extend({
  parent: categorySummarySchema.nullable().optional(),
  children: z.array(categorySummarySchema).optional(),
});

export const brandSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  status: categoryStatusSchema,
  products_count: z.number().int().nonnegative().optional(),
  deleted_at: nullableString,
  created_at: nullableString,
  updated_at: nullableString,
});

export const productVariantSchema = z.object({
  id: z.number().int().positive(),
  product_id: z.number().int().positive(),
  sku: z.string().nullable(),
  barcode: z.string().nullable(),
  title: z.string(),
  price: z.coerce.number().nonnegative(),
  compare_at_price: z.coerce.number().nonnegative().nullable(),
  cost_price: z.coerce.number().nonnegative().nullable(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  attribute_values: z.array(z.unknown()).optional(),
  created_at: nullableString,
  updated_at: nullableString,
});

export const productImageSchema = z.object({
  id: z.number().int().positive(),
  product_id: z.number().int().positive(),
  product_variant_id: z.number().int().positive().nullable(),
  url: z.string().url(),
  format: z.string().nullable(),
  bytes: z.number().int().nonnegative().nullable(),
  width: z.number().int().nonnegative().nullable(),
  height: z.number().int().nonnegative().nullable(),
  alt_text: z.string().nullable(),
  sort_order: z.number().int().nonnegative(),
  is_primary: z.boolean(),
  created_at: nullableString,
});

export const productSchema = z.object({
  id: z.number().int().positive(),
  vendor_id: z.number().int().positive(),
  brand_id: z.number().int().positive().nullable(),
  primary_category_id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  short_description: z.string().nullable(),
  status: productStatusSchema,
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  new_price: z.coerce.number().nonnegative().nullable(),
  old_price: z.coerce.number().nonnegative().nullable(),
  brand: brandSchema.nullable().optional(),
  subcategory: categorySchema.nullable().optional(),
  variants: z.array(productVariantSchema).optional(),
  images: z.array(productImageSchema).optional(),
  deleted_at: nullableString,
  created_at: nullableString,
  updated_at: nullableString,
});

export const paginationMetaSchema = z.object({
  current_page: z.number().int().positive(),
  from: z.number().int().positive().nullable(),
  last_page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  to: z.number().int().positive().nullable(),
  total: z.number().int().nonnegative(),
});

export const paginatedCategoriesSchema = z.object({
  data: z.array(categorySchema),
  meta: paginationMetaSchema,
});
export const paginatedProductsSchema = z.object({
  data: z.array(productSchema),
  meta: paginationMetaSchema,
});
export const paginatedBrandsSchema = z.object({
  data: z.array(brandSchema),
  meta: paginationMetaSchema,
});
export const categoryResponseSchema = z.object({ data: categorySchema });
export const productResponseSchema = z.object({ data: productSchema });
export const productImageResponseSchema = z.object({
  data: productImageSchema,
});
export const productVariantResponseSchema = z.object({
  data: productVariantSchema,
});

const categoryCountsSchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  inactive: z.number().int().nonnegative(),
});
const productCountsSchema = categoryCountsSchema.extend({
  draft: z.number().int().nonnegative(),
});
export const catalogSummaryResponseSchema = z.object({
  data: z.object({
    products: productCountsSchema,
    categories: categoryCountsSchema,
    subcategories: categoryCountsSchema,
  }),
});
export const catalogOptionsResponseSchema = z.object({
  data: z.object({
    categories: z.array(categorySchema),
    subcategories: z.array(categorySchema),
    brands: z.array(brandSchema),
  }),
});

export type CategoryStatus = z.infer<typeof categoryStatusSchema>;
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Brand = z.infer<typeof brandSchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type CatalogSummary = z.infer<
  typeof catalogSummaryResponseSchema
>["data"];
export type CatalogOptions = z.infer<
  typeof catalogOptionsResponseSchema
>["data"];
