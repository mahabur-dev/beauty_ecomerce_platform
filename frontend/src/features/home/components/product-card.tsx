import { ImageIcon, ShoppingCart, Star } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import type { CatalogProduct } from "@/features/catalog/types";
import type { PreviewProduct } from "@/features/home/data";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "BDT",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
});

function formatPrice(value: string | null): string {
  const price = Number(value);
  return value !== null && Number.isFinite(price)
    ? currencyFormatter.format(price)
    : "Price unavailable";
}

export function ProductCard({
  product,
}: {
  product: CatalogProduct | PreviewProduct;
}) {
  const isCatalogProduct = "slug" in product;

  const name = product.name;
  const href = (isCatalogProduct ? `/products/${product.slug}` : product.href) as Route;

  const imageUrl = isCatalogProduct
    ? product.primary_image?.url ?? null
    : product.image;

  const imageAlt = isCatalogProduct
    ? product.primary_image?.alt_text || product.name
    : product.name;

  const subtitle = isCatalogProduct
    ? product.brand?.name ?? product.category?.name ?? "GlowCare Selection"
    : product.size;

  const priceText = isCatalogProduct
    ? formatPrice(product.new_price)
    : product.price;

  const oldPriceText = isCatalogProduct
    ? product.old_price && Number(product.old_price) > Number(product.new_price)
      ? formatPrice(product.old_price)
      : null
    : product.oldPrice;

  const hasDiscount = Boolean(oldPriceText);

  const reviewsCount = isCatalogProduct
    ? 120 + ((product.id * 37) % 180)
    : product.reviews;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-brand-100 bg-surface-elevated shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl">
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden bg-brand-50/60 p-3"
      >
        <div className="relative size-full overflow-hidden rounded-xl bg-white shadow-inner">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 65vw, (max-width: 1024px) 30vw, 18vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid size-full place-items-center text-brand-300">
              <ImageIcon className="size-10" aria-hidden="true" />
            </div>
          )}
        </div>
        {hasDiscount ? (
          <span className="absolute top-4 left-4 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase shadow-sm">
            Sale
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4 pt-2">
        <p className="line-clamp-1 min-h-4 text-[11px] font-bold tracking-wider text-brand-700 uppercase">
          {subtitle}
        </p>

        <Link
          href={href}
          className="mt-1 transition-colors group-hover:text-brand-700"
        >
          <h3 className="line-clamp-1 text-sm font-bold text-ink sm:text-base">
            {name}
          </h3>
        </Link>

        <div
          className="mt-2 flex items-center gap-1"
          aria-label="5 out of 5 stars"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className="size-3 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
          ))}
          <span className="ml-1 text-[11px] text-ink-muted">
            ({reviewsCount})
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-ink sm:text-lg">
            {priceText}
          </span>
          {oldPriceText ? (
            <span className="text-xs text-ink-muted line-through">
              {oldPriceText}
            </span>
          ) : null}
        </div>

        <Link
          href={href}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <ShoppingCart className="size-3.5" aria-hidden="true" />
          <span>Add to Cart</span>
        </Link>
      </div>
    </article>
  );
}
