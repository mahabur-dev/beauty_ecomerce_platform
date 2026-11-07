import { SearchX } from "lucide-react";

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
              {products.data.map((product) => (
                <CatalogProductCard key={product.id} product={product} />
              ))}
            </div>
            <CatalogPagination
              meta={products.meta}
              pathname={pathname}
              query={query}
            />
          </>
        ) : (
          <EmptyState
            icon={SearchX}
            title="No products match these filters"
            description="Try removing a filter, changing the price range, or searching with a broader term."
            action={
              <a
                href={pathname}
                className={buttonStyles({ variant: "outline" })}
              >
                Clear filters
              </a>
            }
          />
        )}
      </section>
    </div>
  );
}
