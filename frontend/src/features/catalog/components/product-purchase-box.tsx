"use client";

import { CheckCircle2, Heart, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { buttonStyles, DismissibleAlert } from "@/components/ui";
import type { CatalogProductDetail } from "@/features/catalog/types";
import { ProductRatingOverview } from "@/features/reviews";
import { cn } from "@/lib/utils/cn";

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

export function ProductPurchaseBox({
  product,
}: {
  product: CatalogProductDetail;
}) {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const newPriceNum = Number(product.new_price);
  const oldPriceNum = Number(product.old_price);
  const hasDiscount =
    product.old_price !== null &&
    oldPriceNum > newPriceNum &&
    Number.isFinite(oldPriceNum) &&
    Number.isFinite(newPriceNum);

  const savingsAmount = hasDiscount ? oldPriceNum - newPriceNum : 0;
  const savingsPercent = hasDiscount
    ? Math.round((savingsAmount / oldPriceNum) * 100)
    : 0;

  function handleDecrease() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function handleIncrease() {
    setQuantity((prev) => Math.min(99, prev + 1));
  }

  function handleAddToCart() {
    setAddedNotice(`Added ${quantity} × “${product.name}” to your cart.`);
  }

  return (
    <div className="border-line/80 bg-surface-elevated/40 shadow-soft flex h-full flex-col justify-between gap-6 rounded-3xl border p-6 sm:p-8">
      {/* Top Header: Category / Brand badges on left, Love icon on top-right */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {product.brand ? (
            <Link
              href={`/brands/${product.brand.slug}` as Route}
              className="text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-full px-3 py-1 font-bold tracking-wide uppercase transition-colors"
            >
              {product.brand.name}
            </Link>
          ) : null}
          {product.category ? (
            <Link
              href={`/categories/${product.category.slug}` as Route}
              className="text-ink-muted hover:text-ink transition-colors"
            >
              {product.category.name}
            </Link>
          ) : null}
          {product.subcategory ? (
            <>
              <span className="text-ink-muted">/</span>
              <span className="text-ink font-medium">
                {product.subcategory.name}
              </span>
            </>
          ) : null}
        </div>

        {/* Love / Wishlist icon button on the top-right corner */}
        <button
          type="button"
          onClick={() => setIsWishlisted((prev) => !prev)}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          className={cn(
            "border-line bg-surface-elevated flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border shadow-xs transition-all duration-200 hover:scale-105 active:scale-95",
            isWishlisted
              ? "border-rose-200 bg-rose-50 text-rose-500 shadow-rose-100"
              : "text-ink-muted hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-500",
          )}
        >
          <Heart
            className={cn(
              "size-5 transition-colors",
              isWishlisted ? "fill-rose-500 text-rose-500" : "",
            )}
          />
        </button>
      </div>

      {/* Product Title & Reviews overview */}
      <div>
        <h1 className="text-ink text-2xl font-extrabold sm:text-3xl lg:text-4xl">
          {product.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ProductRatingOverview productSlug={product.slug} />
          <span className="text-line" aria-hidden="true">
            •
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="size-3.5 text-emerald-600" /> In stock
          </span>
        </div>
      </div>

      {/* Pricing display */}
      <div className="border-line bg-surface-elevated/60 flex flex-wrap items-baseline gap-3 rounded-2xl border p-4 sm:p-5">
        <span className="text-ink text-3xl font-extrabold sm:text-4xl">
          {formatPrice(product.new_price)}
        </span>
        {hasDiscount ? (
          <>
            <span className="text-ink-muted text-lg line-through sm:text-xl">
              {formatPrice(product.old_price)}
            </span>
            <span className="bg-brand-600 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
              Save {currencyFormatter.format(savingsAmount)} ({savingsPercent}% OFF)
            </span>
          </>
        ) : null}
      </div>

      {/* Notice feedback if item added to cart */}
      {addedNotice ? (
        <DismissibleAlert
          tone="success"
          onDismiss={() => setAddedNotice(null)}
        >
          {addedNotice}
        </DismissibleAlert>
      ) : null}

      {/* Quantity & Action Buttons */}
      <div className="space-y-4">
        {/* Quantity selector */}
        <div className="flex items-center gap-3">
          <span className="text-ink text-sm font-bold">Quantity:</span>
          <div className="border-line bg-surface-elevated flex h-11 items-center rounded-xl border shadow-xs">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="text-ink-muted hover:text-ink hover:bg-brand-50 disabled:opacity-40 flex size-11 cursor-pointer items-center justify-center rounded-l-xl transition-colors disabled:cursor-not-allowed"
            >
              <Minus className="size-4" />
            </button>
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  setQuantity(Math.min(99, Math.max(1, val)));
                }
              }}
              aria-label="Item quantity"
              className="text-ink h-full w-12 text-center text-sm font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={handleIncrease}
              disabled={quantity >= 99}
              aria-label="Increase quantity"
              className="text-ink-muted hover:text-ink hover:bg-brand-50 disabled:opacity-40 flex size-11 cursor-pointer items-center justify-center rounded-r-xl transition-colors disabled:cursor-not-allowed"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {/* Add to Cart and Buy Now in ONE ROW */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleAddToCart}
            className={buttonStyles({
              variant: "primary",
              size: "lg",
              className: "h-12 w-full gap-2 rounded-xl text-sm font-bold shadow-md sm:text-base",
            })}
          >
            <ShoppingCart className="size-4.5" />
            Add to Cart
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            className="bg-black text-white hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl text-sm font-bold shadow-md transition-colors sm:text-base"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Trust & Guarantee Badges */}
      <div className="border-line divide-line grid grid-cols-1 gap-3 divide-y pt-2 text-xs sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="flex items-center gap-2.5 pt-2 text-slate-700 sm:pt-0">
          <Truck className="text-brand-600 size-5 shrink-0" />
          <span>Free delivery over ৳1,000 • Nationwide shipping</span>
        </div>
        <div className="flex items-center gap-2.5 pt-2 text-slate-700 sm:pt-0 sm:pl-3">
          <ShieldCheck className="text-brand-600 size-5 shrink-0" />
          <span>100% Authentic formula • 30-day money-back</span>
        </div>
      </div>
    </div>
  );
}
