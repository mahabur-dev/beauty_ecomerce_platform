import { ImageIcon } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import type { CatalogProduct } from "@/features/catalog/types";

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

export function CatalogProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const hasDiscount =
    product.old_price !== null &&
    Number(product.old_price) > Number(product.new_price);

  return (
    <article className="border-brand-100 bg-surface-elevated shadow-soft group flex min-w-0 flex-col overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link
        href={`/products/${product.slug}` as Route}
        className="bg-brand-50 relative aspect-square overflow-hidden block"
      >
        {product.primary_image ? (
          <Image
            src={product.primary_image.url}
            alt={product.primary_image.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="text-brand-300 grid size-full place-items-center">
            <ImageIcon className="size-12" aria-hidden="true" />
            <span className="sr-only">No product image available</span>
          </div>
        )}
        {hasDiscount ? (
          <span className="bg-brand-600 absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
            Sale
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-brand-700 min-h-4 text-[11px] font-bold tracking-wide uppercase">
          {product.brand?.name ??
            product.category?.name ??
            "GlowCare selection"}
        </p>
        <Link href={`/products/${product.slug}` as Route} className="group-hover:text-brand-700 transition-colors">
          <h3 className="text-ink mt-1 line-clamp-2 text-sm leading-5 font-bold sm:text-base">
            {product.name}
          </h3>
        </Link>
        {product.short_description ? (
          <p className="text-ink-muted mt-2 line-clamp-2 text-xs leading-5">
            {product.short_description}
          </p>
        ) : null}
        <div className="mt-auto flex items-baseline gap-2 pt-4">
          <span className="text-ink text-lg font-extrabold">
            {formatPrice(product.new_price)}
          </span>
          {hasDiscount ? (
            <span className="text-ink-muted text-xs line-through">
              {formatPrice(product.old_price)}
            </span>
          ) : null}
        </div>
        {product.subcategory ? (
          <p className="text-ink-muted mt-2 text-xs">
            {product.subcategory.name}
          </p>
        ) : null}
      </div>
    </article>
  );
}
