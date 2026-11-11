import { EmptyState, ErrorState } from "@/components/feedback";
import { getBrands, getCategories } from "@/features/catalog/api";
import { CategoryCard } from "@/features/home/components";

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

  let categories = response.data;
  if (response.meta.last_page > 1) {
    const remainingPages = await Promise.all(
      Array.from({ length: response.meta.last_page - 1 }, (_, idx) =>
        getCategories(idx + 2).catch(() => null),
      ),
    );
    categories = [
      ...categories,
      ...remainingPages.flatMap((page) => page?.data ?? []),
    ];
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        title="No categories yet"
        description="Published categories will appear here."
      />
    );
  }

  return (
    <div
      data-testid="categories-directory-grid"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
    >
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
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
