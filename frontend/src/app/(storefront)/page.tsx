import { Suspense } from "react";

import { Container, Skeleton } from "@/components/ui";
import { getCategories, getProducts } from "@/features/catalog/api";
import {
  CategoryCard,
  HomeHero,
  OfferBanner,
  ProductCard,
  SectionHeading,
  ServiceStrip,
} from "@/features/home/components";
import { homeCategories, previewProducts } from "@/features/home/data";

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
  const backendCategories =
    categoriesResponse?.data && Array.isArray(categoriesResponse.data)
      ? categoriesResponse.data
      : [];
  const displayCategories =
    backendCategories.length > 0
      ? backendCategories.slice(0, 10)
      : homeCategories;

  return (
    <section aria-labelledby="category-heading">
      <div id="category-heading">
        <SectionHeading
          title="Shop by Category"
          actionLabel="View All Categories"
          actionHref="/categories"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {displayCategories.map((category) => (
          <CategoryCard
            key={"slug" in category ? category.slug : category.name}
            category={category}
          />
        ))}
      </div>
    </section>
  );
}

async function HomeBestSellersSection() {
  const productsResponse = await getProducts({
    page: 1,
    perPage: 10,
    sort: "newest",
  }).catch(() => null);

  const backendProducts =
    productsResponse?.data && Array.isArray(productsResponse.data)
      ? productsResponse.data
      : [];
  const displayProducts =
    backendProducts.length > 0
      ? backendProducts.slice(0, 10)
      : previewProducts;

  return (
    <section aria-labelledby="best-sellers-heading">
      <div id="best-sellers-heading">
        <SectionHeading
          title="Best Sellers"
          actionLabel="View All Products"
          actionHref="/products"
        />
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
