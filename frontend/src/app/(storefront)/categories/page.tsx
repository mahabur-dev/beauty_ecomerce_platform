import type { Metadata } from "next";
import { Suspense } from "react";

import { Container, Skeleton } from "@/components/ui";
import { CatalogPageHeader, CategoryDirectory } from "@/features/catalog";

export const metadata: Metadata = {
  title: "Categories | GlowCare",
  description: "Browse GlowCare products by beauty and wellness category.",
};

export default function CategoriesPage() {
  return (
    <>
      <CatalogPageHeader
        eyebrow="Shop your way"
        title="Browse by category"
        description="Move from broad routines to focused product collections in just a few steps."
      />
      <Container className="py-10 sm:py-14">
        <Suspense fallback={<DirectorySkeleton />}>
          <CategoryDirectory />
        </Suspense>
      </Container>
    </>
  );
}

function DirectorySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          className="border-brand-100 bg-surface-elevated overflow-hidden rounded-2xl border p-3"
        >
          <Skeleton className="aspect-[1.12] w-full rounded-xl" />
          <Skeleton className="mx-auto mt-3 h-4 w-3/4 rounded" />
          <Skeleton className="mx-auto mt-2 h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}
