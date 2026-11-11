import { FolderTree } from "lucide-react";
import { Suspense } from "react";

import { EmptyState } from "@/components/feedback";
import { Container, Skeleton } from "@/components/ui";
import { getCategories, getProducts } from "@/features/catalog/api";
import {
  CategoryCarousel,
  HomeHero,
  OfferBanner,
  ProductCard,
  SectionHeading,
  ServiceStrip,
} from "@/features/home/components";
import { previewProducts } from "@/features/home/data";

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <Container className="space-y-12 pb-14 sm:space-y-16 sm:pb-20">
        <Suspense fallback={<HomeCategoriesSkeleton />}>
          <HomeCategoriesSection />
        </Suspense>

        <OfferBanner />

        <Suspense fallback={<HomeBestSellersSkeleton />}>
          <HomeBestSellersSection />
        </Suspense>

        <ServiceStrip />
      </Container>
    </>
  );
}

async function HomeCategoriesSection() {
  const categoriesResponse = await getCategories().catch(() => null);
  const categories =
    categoriesResponse?.data && Array.isArray(categoriesResponse.data)
      ? categoriesResponse.data
      : [];
  const hasMoreThanRow = categories.length > 5;

  return (
    <section aria-labelledby="category-heading">
      <div id="category-heading">
        {hasMoreThanRow ? (
          <SectionHeading
            title="Shop by Category"
            actionLabel="View All Categories"
            actionHref="/categories"
          />
        ) : (
          <SectionHeading title="Shop by Category" />
        )}
      </div>
      {categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Active categories will appear here once published from the catalog."
        />
      ) : (
        <CategoryCarousel categories={categories} />
      )}
    </section>
  );
}

const HOME_PRODUCTS_LIMIT = 10;

async function HomeBestSellersSection() {
  const productsResponse = await getProducts({
    page: 1,
    perPage: HOME_PRODUCTS_LIMIT,
    sort: "newest",
  }).catch(() => null);

  const backendProducts =
    productsResponse?.data && Array.isArray(productsResponse.data)
      ? productsResponse.data
      : [];
  const displayProducts =
    backendProducts.length > 0
      ? backendProducts.slice(0, HOME_PRODUCTS_LIMIT)
      : previewProducts.slice(0, HOME_PRODUCTS_LIMIT);
  const totalProducts =
    backendProducts.length > 0
      ? (productsResponse?.meta?.total ?? backendProducts.length)
      : displayProducts.length;
  const hasMoreProducts = totalProducts > HOME_PRODUCTS_LIMIT;

  return (
    <section aria-labelledby="best-sellers-heading">
      <div id="best-sellers-heading">
        {hasMoreProducts ? (
          <SectionHeading
            title="Best Sellers"
            actionLabel="View All Products"
            actionHref="/products"
          />
        ) : (
          <SectionHeading title="Best Sellers" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {displayProducts.map((product) => (
          <ProductCard
            key={"slug" in product ? product.slug : product.name}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}

function HomeCategoriesSkeleton() {
  return (
    <section aria-label="Loading categories">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-5 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="border-brand-100 bg-surface-elevated overflow-hidden rounded-2xl border p-3"
          >
            <Skeleton className="aspect-[1.12] w-full rounded-xl" />
            <Skeleton className="mx-auto mt-3 h-4 w-3/4 rounded" />
            <Skeleton className="mx-auto mt-2 h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

function HomeBestSellersSkeleton() {
  return (
    <section aria-label="Loading best sellers">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="h-5 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="border-brand-100 bg-surface-elevated flex flex-col overflow-hidden rounded-2xl border p-4"
          >
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="mt-3 h-3 w-1/3 rounded" />
            <Skeleton className="mt-2 h-4 w-4/5 rounded" />
            <Skeleton className="mt-2 h-3 w-1/2 rounded" />
            <Skeleton className="mt-4 h-5 w-2/3 rounded" />
            <Skeleton className="mt-3 h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </section>
  );
}
