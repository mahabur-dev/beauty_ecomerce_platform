import type { Metadata } from "next";
import { Suspense } from "react";

import { Container, Skeleton } from "@/components/ui";
import { BrandDirectory, CatalogPageHeader } from "@/features/catalog";

export const metadata: Metadata = {
  title: "Brands | GlowCare",
  description: "Discover health and beauty brands available from GlowCare.",
};

export default function BrandsPage() {
  return (
    <>
      <CatalogPageHeader
        eyebrow="Trusted names"
        title="Shop by brand"
        description="Explore every active brand in our catalog and find products that fit your routine."
      />
      <Container className="py-10 sm:py-14">
        <Suspense fallback={<BrandSkeleton />}>
          <BrandDirectory />
        </Suspense>
      </Container>
    </>
  );
}

function BrandSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-44 rounded-2xl" />
      ))}
    </div>
  );
}
