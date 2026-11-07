import { Suspense } from "react";

import { ErrorState } from "@/components/feedback";
import { Container, Skeleton } from "@/components/ui";
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
      <Container className="py-14">
        <ErrorState
          title="Category not available"
          description="This category may not exist, may be inactive, or the catalog service is currently unreachable."
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
