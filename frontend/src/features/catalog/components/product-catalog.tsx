import { PackageOpen, SearchX, Sparkles } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/feedback";
import { buttonStyles } from "@/components/ui";
import { getCategories, getFacets, getProducts } from "@/features/catalog/api";
import { CatalogFilters } from "@/features/catalog/components/catalog-filters";
import { CatalogPagination } from "@/features/catalog/components/catalog-pagination";
import { CatalogProductCard } from "@/features/catalog/components/catalog-product-card";
import { parseCatalogQuery } from "@/features/catalog/query";
import type {
  CatalogQuery,
  CatalogSearchParams,
} from "@/features/catalog/types";

export async function ProductCatalog({
  searchParams,
  pathname,
  fixed = {},
}: {
  searchParams: CatalogSearchParams;
  pathname: string;
  fixed?: Partial<Pick<CatalogQuery, "category" | "brand">>;
}) {
  const query = parseCatalogQuery(await searchParams, fixed);
  const result = await Promise.all([
    getProducts(query),
    getCategories(),
    getFacets(),
  ]).catch(() => null);

  if (!result) {
    return (
      <ErrorState
        title="Catalog is temporarily unavailable"
        description="We could not reach the product service. Confirm that the backend is running, then refresh this page."
      />
    );
  }

  const [products, categories, facets] = result;

  const hasActiveFilters = Boolean(
    query.search ||
    query.minPrice ||
    query.maxPrice ||
    (!fixed.brand && (query.brand || (query.brands && query.brands.length > 0))) ||
    (!fixed.category && query.category) ||
    query.subcategory ||
    (query.subcategories && query.subcategories.length > 0) ||
    (query.attributeValueIds && query.attributeValueIds.length > 0),
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <CatalogFilters
        categories={categories.data}
        facets={facets.data}
        pathname={pathname}
        query={query}
        fixed={fixed}
      />

      <section aria-labelledby="catalog-results-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="catalog-results-heading"
              className="text-ink text-xl font-extrabold sm:text-2xl"
            >
              {query.search ? `Results for “${query.search}”` : "Products"}
            </h2>
            <p className="text-ink-muted mt-1 text-sm" aria-live="polite">
              {products.meta.total.toLocaleString()}{" "}
              {products.meta.total === 1 ? "product" : "products"} found
            </p>
          </div>
          <p className="text-ink-muted text-sm">
            Page {products.meta.current_page} of {products.meta.last_page}
          </p>
        </div>

        {products.data.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.data.map((product, index) => (
                <CatalogProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
            <CatalogPagination
              meta={products.meta}
              pathname={pathname}
              query={query}
            />
          </>
        ) : hasActiveFilters ? (
          <EmptyState
            icon={SearchX}
            title="No products match these filters"
            description="We couldn't find any products matching your current filter criteria. Try clearing or relaxing some filters."
            action={
              <Link
                href={pathname as Route}
                className={buttonStyles({
                  variant: "outline",
                  className: "rounded-xl font-bold",
                })}
              >
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={PackageOpen}
            title={
              fixed.category
                ? "No products in this category yet"
                : fixed.brand
                  ? "No products for this brand yet"
                  : "No products currently available"
            }
            description={
              fixed.category
                ? "We are actively curating new beauty and wellness items for this collection. Please check back soon or browse our other categories."
                : "We are updating our catalog with fresh arrivals. Explore our trending products in the meantime."
            }
            action={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/products"
                  className={buttonStyles({
                    variant: "primary",
                    className: "rounded-xl font-bold shadow-md",
                  })}
                >
                  <Sparkles className="size-4" />
                  Explore All Products
                </Link>
                <Link
                  href={"/categories" as Route}
                  className={buttonStyles({
                    variant: "outline",
                    className: "rounded-xl font-bold",
                  })}
                >
                  Browse Other Categories
                </Link>
              </div>
            }
          />
        )}
      </section>
    </div>
  );
}
