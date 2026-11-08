import { PackageSearch, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/feedback";
import { buttonStyles, Container } from "@/components/ui";
import { getProduct, ProductDetailView } from "@/features/catalog";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const response = await getProduct(slug).catch(() => null);

  if (!response?.data) {
    return {
      title: "Product not found | GlowCare",
    };
  }

  const product = response.data;
  return {
    title: `${product.name} | GlowCare`,
    description:
      product.short_description ||
      product.description ||
      `Shop ${product.name} at GlowCare.`,
    openGraph: {
      title: product.name,
      description: product.short_description || undefined,
      images: product.primary_image ? [{ url: product.primary_image.url }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const response = await getProduct(slug).catch(() => null);

  if (!response?.data) {
    return (
      <Container className="py-16 sm:py-20 text-center">
        <EmptyState
          icon={PackageSearch}
          title="Product not found"
          description="The item you're looking for is currently unavailable, may have been discontinued, or has been moved. Discover our latest collection of beauty essentials below."
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
                href="/"
                className={buttonStyles({
                  variant: "outline",
                  size: "lg",
                  className: "rounded-xl font-bold",
                })}
              >
                Return to Home
              </Link>
            </div>
          }
        />
      </Container>
    );
  }

  return <ProductDetailView product={response.data} />;
}

