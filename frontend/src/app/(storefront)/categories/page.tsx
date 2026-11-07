import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { buttonStyles, Container, Skeleton } from "@/components/ui";
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
        <div className="mb-7 flex justify-end">
          <Link
            href="/catalog"
            className={buttonStyles({ variant: "outline" })}
          >
            Explore grouped collections
          </Link>
        </div>
        <Suspense fallback={<DirectorySkeleton />}>
          <CategoryDirectory />
        </Suspense>
      </Container>
    </>
  );
}

function DirectorySkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-72 rounded-2xl" />
      ))}
    </div>
  );
}
