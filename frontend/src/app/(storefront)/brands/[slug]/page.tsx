import { Award, Sparkles } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/feedback";
import { buttonStyles, Container, Skeleton } from "@/components/ui";
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
      <Container className="py-14 sm:py-20">
        <EmptyState
          icon={Award}
          title="Brand currently unavailable"
          description="We couldn't find the brand collection you're looking for. It may have been updated or is temporarily unavailable. Discover our full selection of trusted beauty brands and products below."
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
                href={"/brands" as Route}
                className={buttonStyles({
                  variant: "outline",
                  size: "lg",
                  className: "rounded-xl font-bold",
                })}
              >
                View All Brands
              </Link>
            </div>
          }
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
