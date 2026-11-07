import { Suspense } from "react";

import { ErrorState } from "@/components/feedback";
import { Container, Skeleton } from "@/components/ui";
import {
  CatalogPageHeader,
  CatalogSkeleton,
  getBrand,
  ProductCatalog,
} from "@/features/catalog";
import type { CatalogSearchParams } from "@/features/catalog";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
  searchParams: CatalogSearchParams;
}

export default function BrandPage(props: BrandPageProps) {
  return (
    <Suspense fallback={<BrandPageSkeleton />}>
      <BrandContent {...props} />
    </Suspense>
  );
}

async function BrandContent({ params, searchParams }: BrandPageProps) {
  const { slug } = await params;
  const response = await getBrand(slug).catch(() => null);

  if (!response) {
    return (
      <Container className="py-14">
        <ErrorState
          title="Brand not available"
          description="This brand may not exist, may be inactive, or the catalog service is currently unreachable."
        />
      </Container>
    );
  }

  const brand = response.data;
  return (
    <>
      <CatalogPageHeader
        eyebrow="Brand collection"
        title={brand.name}
        description={`Browse every active ${brand.name} product currently available from GlowCare.`}
      />
      <Container className="py-10 sm:py-14">
        <Suspense fallback={<CatalogSkeleton />}>
          <ProductCatalog
            searchParams={searchParams}
            pathname={`/brands/${slug}`}
            fixed={{ brand: slug }}
          />
        </Suspense>
      </Container>
    </>
  );
}

function BrandPageSkeleton() {
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
