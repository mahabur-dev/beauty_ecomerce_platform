"use client";

import {
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  buttonStyles,
  MultiSelectDropdown,
  SelectDropdown,
} from "@/components/ui";
import { catalogQueryString, catalogSortOptions } from "@/features/catalog/query";
import type {
  CatalogCategory,
  CatalogFacets,
  CatalogQuery,
  CatalogSort,
} from "@/features/catalog/types";

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
  const formKey = `${pathname}?${catalogQueryString(query)}`;

  return (
    <CatalogFiltersForm
      key={formKey}
      categories={categories}
      facets={facets}
      pathname={pathname}
      query={query}
      fixed={fixed}
    />
  );
}

function CatalogFiltersForm({
  categories,
  facets,
  pathname,
  query,
  fixed,
}: {
  categories: CatalogCategory[];
  facets: CatalogFacets;
  pathname: string;
  query: CatalogQuery;
  fixed: Partial<Pick<CatalogQuery, "category" | "brand">>;
}) {
  const router = useRouter();

  const [search, setSearch] = useState(query.search ?? "");
  const [selectedCategory, setSelectedCategory] = useState(
    fixed.category ?? query.category ?? "",
  );
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    () => query.subcategories ?? (query.subcategory ? [query.subcategory] : []),
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() =>
    fixed.brand
      ? [fixed.brand]
      : query.brands ?? (query.brand ? [query.brand] : []),
  );
  const [selectedAttributes, setSelectedAttributes] = useState<number[]>(
    () => query.attributeValueIds ?? [],
  );
  const [minPrice, setMinPrice] = useState(query.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(query.maxPrice ?? "");
  const [sort, setSort] = useState<CatalogSort>(query.sort ?? "newest");

  // Determine available subcategories based on chosen category or fixed scope
  const activeCategorySlug = fixed.category ?? selectedCategory;

  const subcategoryOptions = useMemo(() => {
    const relevantCategories = activeCategorySlug
      ? categories.filter((c) => c.slug === activeCategorySlug)
      : categories;

    return relevantCategories.flatMap((cat) =>
      (cat.subcategories ?? []).map((sub) => ({
        value: sub.slug,
        label: sub.name,
        group: cat.name,
      })),
    );
  }, [categories, activeCategorySlug]);

  const brandOptions = useMemo(
    () =>
      facets.brands.map((b) => ({
        value: b.slug,
        label: b.name,
      })),
    [facets.brands],
  );

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((c) => ({
        value: c.slug,
        label: c.name,
      })),
    ],
    [categories],
  );

  const sortOptions = useMemo(
    () =>
      catalogSortOptions.map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
    [],
  );

  function handleAttributeToggle(valueId: number) {
    setSelectedAttributes((prev) =>
      prev.includes(valueId)
        ? prev.filter((id) => id !== valueId)
        : [...prev, valueId],
    );
  }

  function handleCategoryChange(newCategory: string) {
    setSelectedCategory(newCategory);
    // Filter out subcategories that don't belong to newly selected category
    if (newCategory) {
      const cat = categories.find((c) => c.slug === newCategory);
      const validSubSlugs = new Set(
        (cat?.subcategories ?? []).map((s) => s.slug),
      );
      setSelectedSubcategories((prev) =>
        prev.filter((slug) => validSubSlugs.has(slug)),
      );
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();

    const trimmedSearch = search.trim();
    if (trimmedSearch) params.set("search", trimmedSearch);

    if (!fixed.category && selectedCategory) {
      params.set("category", selectedCategory);
    }

    if (selectedSubcategories.length > 0) {
      params.set("subcategories", selectedSubcategories.join(","));
    }

    if (!fixed.brand && selectedBrands.length > 0) {
      params.set("brands", selectedBrands.join(","));
    }

    if (selectedAttributes.length > 0) {
      params.set("attributes", selectedAttributes.join(","));
    }

    const trimmedMin = minPrice.trim();
    if (trimmedMin) params.set("min_price", trimmedMin);

    const trimmedMax = maxPrice.trim();
    if (trimmedMax) params.set("max_price", trimmedMax);

    if (sort !== "newest") params.set("sort", sort);

    const queryString = params.toString();
    router.push(
      (queryString ? `${pathname}?${queryString}` : pathname) as Route,
    );
  }

  // Count active applied filters
  const activeFiltersCount =
    (search.trim() ? 1 : 0) +
    (!fixed.category && selectedCategory ? 1 : 0) +
    selectedSubcategories.length +
    (!fixed.brand ? selectedBrands.length : 0) +
    selectedAttributes.length +
    (minPrice.trim() ? 1 : 0) +
    (maxPrice.trim() ? 1 : 0) +
    (sort !== "newest" ? 1 : 0);

  return (
    <aside className="border-brand-100 bg-surface-elevated shadow-soft h-fit rounded-3xl border p-5 sm:p-6 lg:sticky lg:top-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-100/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-ink text-base font-bold sm:text-lg">
              Filter products
            </h2>
            {activeFiltersCount > 0 ? (
              <p className="text-brand-700 text-xs font-semibold">
                {activeFiltersCount}{" "}
                {activeFiltersCount === 1 ? "filter active" : "filters active"}
              </p>
            ) : null}
          </div>
        </div>

        {activeFiltersCount > 0 ? (
          <Link
            href={pathname as Route}
            className="text-ink-muted hover:text-brand-700 inline-flex items-center gap-1 text-xs font-semibold transition"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Link>
        ) : null}
      </div>

      <form
        suppressHydrationWarning
        onSubmit={handleSubmit}
        className="mt-5 space-y-5"
      >
        {fixed.category ? (
          <input type="hidden" name="category" value={fixed.category} />
        ) : null}
        {fixed.brand ? (
          <input type="hidden" name="brand" value={fixed.brand} />
        ) : null}

        {/* Search */}
        <div>
          <label
            htmlFor="filter-search-input"
            className="text-ink mb-1.5 block text-xs font-bold uppercase tracking-wider"
          >
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              id="filter-search-input"
              type="search"
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product or brand..."
              className="h-11 w-full rounded-xl border border-line bg-surface-elevated pl-10 pr-3.5 text-sm text-ink outline-none placeholder:text-ink-muted shadow-2xs transition hover:border-brand-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            />
          </div>
        </div>

        {/* Category (Single select dropdown, if not fixed) */}
        {!fixed.category ? (
          <div>
            <label className="text-ink mb-1.5 block text-xs font-bold uppercase tracking-wider">
              Category
            </label>
            <SelectDropdown
              value={selectedCategory}
              onChange={handleCategoryChange}
              options={categoryOptions}
              placeholder="All categories"
              aria-label="Filter by category"
            />
          </div>
        ) : null}

        {/* Subcategory (Reusable Multi-Select Dropdown) */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-ink text-xs font-bold uppercase tracking-wider">
              Subcategory
            </label>
            {selectedSubcategories.length > 0 ? (
              <span className="text-[11px] font-bold text-brand-700">
                {selectedSubcategories.length} chosen
              </span>
            ) : null}
          </div>
          <MultiSelectDropdown
            values={selectedSubcategories}
            onChange={setSelectedSubcategories}
            options={subcategoryOptions}
            placeholder="All subcategories"
            searchPlaceholder="Search subcategories..."
            aria-label="Filter by subcategories"
          />
        </div>

        {/* Brand (Reusable Multi-Select Dropdown, if not fixed) */}
        {!fixed.brand ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-ink text-xs font-bold uppercase tracking-wider">
                Brand
              </label>
              {selectedBrands.length > 0 ? (
                <span className="text-[11px] font-bold text-brand-700">
                  {selectedBrands.length} chosen
                </span>
              ) : null}
            </div>
            <MultiSelectDropdown
              values={selectedBrands}
              onChange={setSelectedBrands}
              options={brandOptions}
              placeholder="All brands"
              searchPlaceholder="Search brands..."
              aria-label="Filter by brands"
            />
          </div>
        ) : null}

        {/* Price range in BDT */}
        <div>
          <label className="text-ink mb-1.5 block text-xs font-bold uppercase tracking-wider">
            Price range (৳)
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted">
                ৳
              </span>
              <input
                type="number"
                name="min_price"
                min="0"
                step="1"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                aria-label="Minimum price in Taka"
                className="h-11 w-full rounded-xl border border-line bg-surface-elevated pl-7 pr-3 text-sm text-ink outline-none shadow-2xs transition hover:border-brand-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted">
                ৳
              </span>
              <input
                type="number"
                name="max_price"
                min="0"
                step="1"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                aria-label="Maximum price in Taka"
                className="h-11 w-full rounded-xl border border-line bg-surface-elevated pl-7 pr-3 text-sm text-ink outline-none shadow-2xs transition hover:border-brand-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </div>
          </div>
        </div>

        {/* Facet Attributes (e.g. Shade / Skin Type) */}
        {facets.attributes.map((attribute) => (
          <div key={attribute.id} className="border-t border-brand-100/60 pt-4">
            <div className="mb-2.5 flex items-center gap-1.5">
              <Tag className="size-3.5 text-brand-600" />
              <span className="text-ink text-xs font-bold uppercase tracking-wider">
                {attribute.name}
              </span>
            </div>
            <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
              {attribute.values.map((value) => {
                const isChecked = selectedAttributes.includes(value.id);
                return (
                  <label
                    key={value.id}
                    className="group flex cursor-pointer items-center justify-between rounded-lg p-1 transition hover:bg-brand-50/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleAttributeToggle(value.id)}
                        className="size-4 rounded border-line text-brand-600 accent-brand-600 transition focus:ring-2 focus:ring-brand-200"
                      />
                      <span className="text-sm text-ink transition group-hover:text-brand-900">
                        {value.value}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sort by (Reusable Select Dropdown) */}
        <div className="border-t border-brand-100/60 pt-4">
          <label className="text-ink mb-1.5 block text-xs font-bold uppercase tracking-wider">
            Sort by
          </label>
          <SelectDropdown
            value={sort}
            onChange={(val) => setSort(val as CatalogSort)}
            options={sortOptions}
            aria-label="Sort products by"
          />
        </div>

        {/* Form Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="submit"
            className={buttonStyles({
              variant: "primary",
              size: "md",
              className: "w-full rounded-xl font-bold shadow-sm",
            })}
          >
            <Sparkles className="size-4" />
            Apply
          </button>
          <Link
            href={pathname as Route}
            className={buttonStyles({
              variant: "outline",
              size: "md",
              className: "w-full rounded-xl font-bold",
            })}
          >
            Reset
          </Link>
        </div>
      </form>
    </aside>
  );
}
