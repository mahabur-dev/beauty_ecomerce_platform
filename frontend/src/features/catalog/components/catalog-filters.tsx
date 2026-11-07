import { SlidersHorizontal } from "lucide-react";

import { buttonStyles } from "@/components/ui";
import { catalogSortOptions } from "@/features/catalog/query";
import type {
  CatalogCategory,
  CatalogFacets,
  CatalogQuery,
} from "@/features/catalog/types";

const controlClass =
  "border-line bg-surface-elevated text-ink focus:border-brand-500 focus:ring-brand-100 h-11 w-full rounded-xl border px-3 text-sm outline-none focus:ring-4";

export function CatalogFilters({
  categories,
  facets,
  pathname,
  query,
  fixed = {},
}: {
  categories: CatalogCategory[];
  facets: CatalogFacets;
  pathname: string;
  query: CatalogQuery;
  fixed?: Partial<Pick<CatalogQuery, "category" | "brand">>;
}) {
  const visibleSubcategories = categories
    .filter((category) =>
      query.category ? category.slug === query.category : true,
    )
    .flatMap((category) =>
      (category.subcategories ?? []).map((subcategory) => ({
        categoryName: category.name,
        subcategory,
      })),
    );

  return (
    <aside className="border-line bg-surface-elevated h-fit rounded-2xl border p-5 lg:sticky lg:top-5">
      <div className="flex items-center gap-2">
        <SlidersHorizontal
          className="text-brand-600 size-5"
          aria-hidden="true"
        />
        <h2 className="text-ink text-lg font-bold">Filter products</h2>
      </div>

      <form action={pathname} className="mt-5 space-y-5">
        {fixed.category ? (
          <input type="hidden" name="category" value={fixed.category} />
        ) : null}
        {fixed.brand ? (
          <input type="hidden" name="brand" value={fixed.brand} />
        ) : null}

        <label className="block">
          <span className="text-ink mb-2 block text-sm font-semibold">
            Search
          </span>
          <input
            type="search"
            name="search"
            defaultValue={query.search}
            placeholder="Product or brand"
            className={controlClass}
          />
        </label>

        {!fixed.category ? (
          <label className="block">
            <span className="text-ink mb-2 block text-sm font-semibold">
              Category
            </span>
            <select
              name="category"
              defaultValue={query.category ?? ""}
              className={controlClass}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block">
          <span className="text-ink mb-2 block text-sm font-semibold">
            Subcategory
          </span>
          <select
            name="subcategory"
            defaultValue={query.subcategory ?? ""}
            className={controlClass}
          >
            <option value="">All subcategories</option>
            {visibleSubcategories.map(({ categoryName, subcategory }) => (
              <option key={subcategory.id} value={subcategory.slug}>
                {categoryName} · {subcategory.name}
              </option>
            ))}
          </select>
        </label>

        {!fixed.brand ? (
          <label className="block">
            <span className="text-ink mb-2 block text-sm font-semibold">
              Brand
            </span>
            <select
              name="brand"
              defaultValue={query.brand ?? ""}
              className={controlClass}
            >
              <option value="">All brands</option>
              {facets.brands.map((brand) => (
                <option key={brand.id} value={brand.slug}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <fieldset>
          <legend className="text-ink mb-2 text-sm font-semibold">
            Price range
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              name="min_price"
              min="0"
              step="0.01"
              defaultValue={query.minPrice}
              placeholder="Min"
              aria-label="Minimum price"
              className={controlClass}
            />
            <input
              type="number"
              name="max_price"
              min="0"
              step="0.01"
              defaultValue={query.maxPrice}
              placeholder="Max"
              aria-label="Maximum price"
              className={controlClass}
            />
          </div>
        </fieldset>

        {facets.attributes.map((attribute) => (
          <fieldset key={attribute.id}>
            <legend className="text-ink mb-2 text-sm font-semibold">
              {attribute.name}
            </legend>
            <div className="max-h-32 space-y-2 overflow-auto pr-1">
              {attribute.values.map((value) => (
                <label
                  key={value.id}
                  className="text-ink-muted flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="attributes"
                    value={value.id}
                    defaultChecked={query.attributeValueIds?.includes(value.id)}
                    className="accent-brand-600 size-4"
                  />
                  {value.value}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <label className="block">
          <span className="text-ink mb-2 block text-sm font-semibold">
            Sort by
          </span>
          <select
            name="sort"
            defaultValue={query.sort}
            className={controlClass}
          >
            {catalogSortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button type="submit" className={buttonStyles({ size: "sm" })}>
            Apply
          </button>
          <a
            href={pathname}
            className={buttonStyles({ variant: "outline", size: "sm" })}
          >
            Reset
          </a>
        </div>
      </form>
    </aside>
  );
}
