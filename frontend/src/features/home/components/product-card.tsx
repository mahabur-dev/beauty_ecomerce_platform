import { ShoppingCart, Star } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui";
import type { PreviewProduct } from "@/features/home/data";

export function ProductCard({ product }: { product: PreviewProduct }) {
  return (
    <article className="border-brand-100 bg-surface-elevated shadow-soft flex min-w-0 flex-col overflow-hidden rounded-2xl border">
      <a href={product.href} className="bg-white p-3">
        <div className="relative aspect-square overflow-hidden rounded-xl">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 65vw, (max-width: 1024px) 30vw, 18vw"
            className="object-cover"
          />
        </div>
      </a>
      <div className="flex flex-1 flex-col p-4 pt-1">
        <a href={product.href}>
          <h3 className="text-ink line-clamp-1 text-sm font-bold">
            {product.name}
          </h3>
        </a>
        <p className="text-ink-muted mt-1 text-xs">{product.size}</p>
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
          <span className="text-ink-muted ml-1 text-[11px]">
            ({product.reviews})
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-ink text-lg font-extrabold">
            {product.price}
          </span>
          <span className="text-ink-muted text-xs line-through">
            {product.oldPrice}
          </span>
        </div>
        <Button size="sm" className="mt-3 w-full rounded-lg">
          <ShoppingCart className="size-4" aria-hidden="true" />
          Add to Cart
        </Button>
      </div>
    </article>
  );
}
