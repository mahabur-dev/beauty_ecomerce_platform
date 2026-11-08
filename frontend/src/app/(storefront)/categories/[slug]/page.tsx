import { FolderSearch, Sparkles } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/feedback";
import { buttonStyles, Container, Skeleton } from "@/components/ui";
import {
  CatalogPageHeader,
  CatalogSkeleton,
  getCategory,
  ProductCatalog,
} from "@/features/catalog";
import type { CatalogSearchParams } from "@/features/catalog";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: CatalogSearchParams;
}

export default function CategoryPage(props: CategoryPageProps) {
  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <CategoryContent {...props} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const response = await getCategory(slug).catch(() => null);

  if (!response) {
    return (
      <Container className="py-14 sm:py-20">
        <EmptyState
          icon={FolderSearch}
          title="Category currently unavailable"
          description="We couldn't find the category you're looking for. It may have been moved, updated, or is temporarily unavailable. Discover our full selection of beauty and skincare collections below."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/products"
                className={buttonStyles({
                  variant: "primary",
                  size: "lg",
                  className: "rounded-xl font-bold shadow-md",
                })}
              >
                <Sparkles className="size-4" />
                Browse All Products
              </Link>
              <Link
                href={"/categories" as Route}
                className={buttonStyles({
                  variant: "outline",
                  size: "lg",
                  className: "rounded-xl font-bold",
                })}
              >
                View All Categories
              </Link>
            </div>
          }
        />
      </Container>
    );
  }

  const category = response.data;
  return (
    <>
      <CatalogPageHeader
        eyebrow="Category"
        title={category.name}
        description={
          category.description ??
          `Discover active ${category.name.toLowerCase()} products from the GlowCare catalog.`
        }
      />
      <Container className="py-10 sm:py-14">
        <Suspense fallback={<CatalogSkeleton />}>
          <ProductCatalog
            searchParams={searchParams}
            pathname={`/categories/${slug}`}
            fixed={{ category: slug }}
          />
        </Suspense>
      </Container>
    </>
  );
}

function CategoryPageSkeleton() {
  return (
    <>
      <div className="bg-brand-50/70 border-brand-100 border-y">
        <Container className="py-14">
          <Skeleton className="h-10 w-64" />
        </Container>
      </div>
      <Container className="py-14">
        <CatalogSkeleton />
      </Container>
    </>
  );
}
