import type { CatalogQuery, CatalogSort } from "@/features/catalog/types";

export const catalogSortOptions: ReadonlyArray<{
  value: CatalogSort;
  label: string;
}> = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];

const validSorts = new Set<CatalogSort>(
  catalogSortOptions.map((option) => option.value),
);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function optionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function optionalPrice(value: string | undefined): string | undefined {
  const normalized = optionalText(value);
  if (!normalized || !/^\d+(?:\.\d{1,2})?$/.test(normalized)) return undefined;

  return Number(normalized) >= 0 ? normalized : undefined;
}

function parseAttributeIds(
  value: string | string[] | undefined,
): number[] | undefined {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];
  const ids = rawValues
    .flatMap((entry) => entry.split(","))
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0);

  return ids.length > 0 ? [...new Set(ids)] : undefined;
}

export function parseCatalogQuery(
  params: Record<string, string | string[] | undefined>,
  defaults: Partial<
    Pick<CatalogQuery, "category" | "subcategory" | "brand">
  > = {},
): CatalogQuery {
  const requestedSort = first(params.sort) as CatalogSort | undefined;
  const minPrice = optionalPrice(first(params.min_price));
  const requestedMaxPrice = optionalPrice(first(params.max_price));
  const maxPrice =
    requestedMaxPrice &&
    (minPrice === undefined || Number(requestedMaxPrice) >= Number(minPrice))
      ? requestedMaxPrice
      : undefined;

  return {
    search: optionalText(first(params.search)),
    category: defaults.category ?? optionalText(first(params.category)),
    subcategory:
      defaults.subcategory ?? optionalText(first(params.subcategory)),
    brand: defaults.brand ?? optionalText(first(params.brand)),
    attributeValueIds: parseAttributeIds(
      params.attributes ?? params["attribute_value_ids[]"],
    ),
    minPrice,
    maxPrice,
    sort:
      requestedSort && validSorts.has(requestedSort) ? requestedSort : "newest",
    page: positiveInteger(first(params.page), 1),
    perPage: 20,
  };
}

export function catalogQueryString(
  query: CatalogQuery,
  overrides: Partial<CatalogQuery> = {},
): string {
  const value = { ...query, ...overrides };
  const params = new URLSearchParams();

  if (value.search) params.set("search", value.search);
  if (value.category) params.set("category", value.category);
  if (value.subcategory) params.set("subcategory", value.subcategory);
  if (value.brand) params.set("brand", value.brand);
  if (value.attributeValueIds?.length) {
    params.set("attribute_value_ids", value.attributeValueIds.join(","));
  }
  if (value.minPrice) params.set("min_price", value.minPrice);
  if (value.maxPrice) params.set("max_price", value.maxPrice);
  if (value.sort !== "newest") params.set("sort", value.sort);
  if (value.page > 1) params.set("page", String(value.page));
  params.set("per_page", String(value.perPage));

  return params.toString();
}

export function catalogPageHref(
  pathname: string,
  query: CatalogQuery,
  page: number,
): string {
  const params = new URLSearchParams(catalogQueryString(query, { page }));
  params.delete("per_page");
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}
