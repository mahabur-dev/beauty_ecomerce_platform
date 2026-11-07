import { ArrowRight, FolderTree, Sparkles } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/feedback";
import { getBrands, getCategories } from "@/features/catalog/api";

export async function CategoryDirectory() {
  const response = await getCategories().catch(() => null);

  if (!response) {
    return (
      <ErrorState
        title="Categories are unavailable"
        description="Start the backend service and refresh to load the category catalog."
      />
    );
  }

  const categories = response.data;
  if (categories.length === 0) {
    return (
      <EmptyState
        title="No categories yet"
        description="Published categories will appear here."
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category, index) => (
        <article
          key={category.id}
          className="border-brand-100 bg-surface-elevated shadow-soft rounded-2xl border p-6"
        >
          <span className="bg-brand-50 text-brand-700 grid size-11 place-items-center rounded-xl">
            {index % 2 === 0 ? (
              <FolderTree className="size-5" aria-hidden="true" />
            ) : (
              <Sparkles className="size-5" aria-hidden="true" />
            )}
          </span>
          <h2 className="text-ink mt-5 text-xl font-extrabold">
            {category.name}
          </h2>
          <p className="text-ink-muted mt-2 min-h-12 text-sm leading-6">
            {category.description ??
              `Explore ${category.name.toLowerCase()} products selected for your everyday routine.`}
          </p>
          {(category.subcategories ?? []).length > 0 ? (
            <ul
              className="mt-4 flex flex-wrap gap-2"
              aria-label={`${category.name} subcategories`}
            >
              {category.subcategories?.slice(0, 4).map((subcategory) => (
                <li
                  key={subcategory.id}
                  className="bg-brand-50 text-brand-800 rounded-full px-3 py-1 text-xs font-semibold"
                >
                  {subcategory.name}
                </li>
              ))}
            </ul>
          ) : null}
          <a
            href={`/categories/${category.slug}`}
            className="text-brand-700 mt-6 inline-flex items-center gap-2 text-sm font-bold hover:underline"
          >
            Browse category <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </article>
      ))}
    </div>
  );
}

export async function BrandDirectory() {
  const response = await getBrands().catch(() => null);

  if (!response) {
    return (
      <ErrorState
        title="Brands are unavailable"
        description="Start the backend service and refresh to load the brand directory."
      />
    );
  }

  const brands = response.data;
  if (brands.length === 0) {
    return (
      <EmptyState
        title="No brands yet"
        description="Published brands will appear here."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {brands.map((brand) => (
        <a
          key={brand.id}
          href={`/brands/${brand.slug}`}
          className="border-brand-100 bg-surface-elevated shadow-soft group rounded-2xl border p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <span className="bg-brand-50 text-brand-700 mx-auto grid size-14 place-items-center rounded-full text-xl font-black">
            {brand.name.charAt(0).toUpperCase()}
          </span>
          <h2 className="text-ink group-hover:text-brand-700 mt-4 font-bold">
            {brand.name}
          </h2>
          <span className="text-ink-muted mt-1 block text-xs">
            View products
          </span>
        </a>
      ))}
    </div>
  );
}
