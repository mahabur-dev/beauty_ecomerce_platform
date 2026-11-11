import { Check, ChevronRight, Sparkles } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Container } from "@/components/ui";
import type { CatalogProductDetail } from "@/features/catalog/types";
import { ProductReviewsSection } from "@/features/reviews";

import { ProductGallery } from "./product-gallery";
import { ProductPurchaseBox } from "./product-purchase-box";

export function ProductDetailView({
  product,
}: {
  product: CatalogProductDetail;
}) {
  const images = product.images?.length > 0
    ? product.images
    : product.primary_image
      ? [product.primary_image]
      : [];

  const defaultVariant = product.variants?.find((v) => v.is_default) ?? product.variants?.[0];

  return (
    <article className="py-8 sm:py-12">
      <Container>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="text-ink-muted mb-8 flex flex-wrap items-center gap-2 text-xs font-medium"
        >
          <Link href="/" className="hover:text-ink transition-colors">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/products" className="hover:text-ink transition-colors">
            Products
          </Link>
          {product.category ? (
            <>
              <ChevronRight className="size-3.5" />
              <Link
                href={`/categories/${product.category.slug}` as Route}
                className="hover:text-ink transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          ) : null}
          {product.subcategory ? (
            <>
              <ChevronRight className="size-3.5" />
              <span className="text-ink-muted">{product.subcategory.name}</span>
            </>
          ) : null}
          <ChevronRight className="size-3.5" />
          <span className="text-ink font-semibold truncate max-w-56 sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        {/* Top Section: Gallery (Left) & Purchase Box (Right) */}
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-14">
          <ProductGallery
            images={images}
            name={product.name}
            hasDiscount={
              product.old_price !== null &&
              Number(product.old_price) > Number(product.new_price)
            }
          />
          <ProductPurchaseBox product={product} />
        </div>

        {/* Mid Section: Product Description & Highlights */}
        <div className="border-line my-16 border-t pt-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Left 2 cols: Full Description */}
            <div className="space-y-6 lg:col-span-2">
              <h2 className="text-ink text-2xl font-extrabold sm:text-3xl">
                About this item
              </h2>

              <div className="text-ink/85 space-y-4 text-base leading-relaxed">
                {product.short_description && product.short_description !== product.description ? (
                  <p className="text-ink text-base font-medium leading-relaxed sm:text-lg">
                    {product.short_description}
                  </p>
                ) : null}

                {product.description ? (
                  <p className="whitespace-pre-line">{product.description}</p>
                ) : product.short_description ? (
                  <p className="whitespace-pre-line">{product.short_description}</p>
                ) : (
                  <p>
                    Experience top-tier quality with {product.name}, crafted to deliver
                    effective beauty and care results for everyday wellness.
                  </p>
                )}
              </div>

              {/* Product Key Highlights */}
              <div className="border-brand-100 bg-brand-50/50 rounded-2xl border p-5 sm:p-6">
                <h3 className="text-ink flex items-center gap-2 text-base font-bold">
                  <Sparkles className="text-brand-600 size-5" />
                  Key Features & Highlights
                </h3>
                <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="text-brand-600 size-4 shrink-0" />
                    <span>Dermatologist recommended & tested</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-brand-600 size-4 shrink-0" />
                    <span>Nourishing natural active ingredients</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-brand-600 size-4 shrink-0" />
                    <span>Suitable for all skin types</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-brand-600 size-4 shrink-0" />
                    <span>Cruelty-free & eco-conscious formula</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right col: Specifications card */}
            <div className="border-line bg-surface-elevated shadow-soft h-fit rounded-3xl border p-6">
              <h3 className="text-ink text-lg font-bold">Specifications</h3>
              <dl className="divide-line divide-y text-xs sm:text-sm">
                <div className="flex justify-between py-3">
                  <dt className="text-ink-muted">Brand</dt>
                  <dd className="text-ink font-semibold">
                    {product.brand?.name ?? "GlowCare Originals"}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-ink-muted">Category</dt>
                  <dd className="text-ink font-semibold">
                    {product.category?.name ?? "Cosmetics & Skincare"}
                  </dd>
                </div>
                {product.subcategory ? (
                  <div className="flex justify-between py-3">
                    <dt className="text-ink-muted">Collection</dt>
                    <dd className="text-ink font-semibold">
                      {product.subcategory.name}
                    </dd>
                  </div>
                ) : null}
                {defaultVariant?.sku ? (
                  <div className="flex justify-between py-3">
                    <dt className="text-ink-muted">Item SKU</dt>
                    <dd className="text-ink font-mono font-medium">
                      {defaultVariant.sku}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between py-3">
                  <dt className="text-ink-muted">Item Status</dt>
                  <dd className="font-semibold text-emerald-600">
                    Active & Verified
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-ink-muted">Authenticity</dt>
                  <dd className="text-ink font-semibold">100% Genuine</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Customer Reviews & Ratings Section */}
        <div className="border-line border-t pt-16">
          <ProductReviewsSection
            productSlug={product.slug}
            productName={product.name}
          />
        </div>
      </Container>
    </article>
  );
}

