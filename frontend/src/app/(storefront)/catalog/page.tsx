import { notFound } from "next/navigation";

// /catalog route is temporarily disabled and returns 404.
export default function CatalogPage() {
  notFound();
}

/*
import type { Metadata } from "next";
import { Suspense } from "react";

import { Container, Skeleton } from "@/components/ui";
import { CatalogPageHeader, GroupedCatalog } from "@/features/catalog";
import type { CatalogSearchParams } from "@/features/catalog";

export const metadata: Metadata = {
  title: "Collections | GlowCare",
  description: "Explore GlowCare's grouped product collections.",
};

export default function CatalogPage({
  searchParams,
}: {
  searchParams: CatalogSearchParams;
}) {
  return (
    <>
      <CatalogPageHeader
        eyebrow="Curated for discovery"
        title="Explore product collections"
        description="Browse the newest products grouped into focused beauty and wellness collections."
      />
      <Container className="py-10 sm:py-14">
        <Suspense fallback={<GroupedSkeleton />}>
          <GroupedCatalog searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

function GroupedSkeleton() {
  return (
    <div className="space-y-12">
      {Array.from({ length: 2 }, (_, group) => (
        <div key={group}>
          <Skeleton className="mb-5 h-8 w-52" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, card) => (
              <Skeleton key={card} className="aspect-[.72] rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
*/
