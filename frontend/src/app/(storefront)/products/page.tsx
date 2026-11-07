import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/ui";
import {
  CatalogPageHeader,
  CatalogSkeleton,
  ProductCatalog,
} from "@/features/catalog";
import type { CatalogSearchParams } from "@/features/catalog";

export const metadata: Metadata = {
  title: "Shop all products | GlowCare",
  description:
    "Search and filter GlowCare's health, beauty and wellness catalog.",
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: CatalogSearchParams;
}) {
  return (
    <>
      <CatalogPageHeader
        eyebrow="GlowCare catalog"
        title="Find your everyday essentials"
        description="Search our catalog and refine it by category, brand, price, product attributes and more."
      />
      <Container className="py-10 sm:py-14">
        <Suspense fallback={<CatalogSkeleton />}>
          <ProductCatalog searchParams={searchParams} pathname="/products" />
        </Suspense>
      </Container>
    </>
  );
}
