import { EmptyState, ErrorState } from "@/components/feedback";
import { getGroupedCatalog } from "@/features/catalog/api";
import { CatalogProductCard } from "@/features/catalog/components/catalog-product-card";
import type { CatalogSearchParams } from "@/features/catalog/types";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function GroupedCatalog({
  searchParams,
}: {
  searchParams: CatalogSearchParams;
}) {
  const params = await searchParams;
  const category = first(params.category);
  const requestedPage = Number(first(params.page));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const catalog = await getGroupedCatalog(category, page).catch(() => null);

  if (!catalog) {
    return (
      <ErrorState
        title="Collections are unavailable"
        description="The grouped catalog could not be loaded. Confirm the backend is running and try again."
      />
    );
  }

  if (catalog.data.length === 0) {
    return (
      <EmptyState
        title="No grouped products found"
        description="Choose another category or check back after products are published."
      />
    );
  }

  const categoryQuery = category
    ? `&category=${encodeURIComponent(category)}`
    : "";

  return (
    <div className="space-y-12">
      {catalog.data.map((group) => (
        <section
          key={group.subcategory.id}
          aria-labelledby={`group-${group.subcategory.id}`}
        >
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-brand-700 text-xs font-bold tracking-widest uppercase">
                {group.subcategory.parent?.name ?? "Curated collection"}
              </p>
              <h2
                id={`group-${group.subcategory.id}`}
                className="text-ink mt-1 text-2xl font-extrabold"
              >
                {group.subcategory.name}
              </h2>
            </div>
            <a
              href={`/products?subcategory=${group.subcategory.slug}`}
              className="text-brand-700 text-sm font-bold hover:underline"
            >
              View all
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {group.products.slice(0, 5).map((product) => (
              <CatalogProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}

      {catalog.meta.last_page > 1 ? (
        <nav
          className="flex items-center justify-center gap-3"
          aria-label="Catalog groups pages"
        >
          {page > 1 ? (
            <a
              className="text-brand-700 font-bold"
              href={`/catalog?page=${page - 1}${categoryQuery}`}
            >
              Previous groups
            </a>
          ) : null}
          <span className="text-ink-muted text-sm">
            Page {page} of {catalog.meta.last_page}
          </span>
          {page < catalog.meta.last_page ? (
            <a
              className="text-brand-700 font-bold"
              href={`/catalog?page=${page + 1}${categoryQuery}`}
            >
              Next groups
            </a>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
