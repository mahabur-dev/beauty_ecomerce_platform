"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { CatalogImage } from "@/features/catalog/types";
import { cn } from "@/lib/utils/cn";

export function ProductGallery({
  images,
  name,
  hasDiscount = false,
}: {
  images: CatalogImage[];
  name: string;
  hasDiscount?: boolean;
}) {
  const primary = images.find((img) => img.is_primary) ?? images[0] ?? null;
  const [selectedImage, setSelectedImage] = useState<CatalogImage | null>(primary);

  const activeImage = selectedImage ?? primary;

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      {/* Primary / Active Image Canvas */}
      <div className="border-brand-100/80 bg-surface-elevated shadow-soft group relative aspect-square w-full flex-1 overflow-hidden rounded-3xl border min-h-[380px] sm:min-h-[460px]">
        {activeImage ? (
          <Image
            src={activeImage.url}
            alt={activeImage.alt_text || name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="text-brand-300 grid size-full place-items-center">
            <ImageIcon className="size-20" aria-hidden="true" />
            <span className="sr-only">No image available</span>
          </div>
        )}

        {hasDiscount ? (
          <span className="bg-brand-600 absolute top-4 left-4 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-md">
            Special Sale
          </span>
        ) : null}
      </div>

      {/* Thumbnails list if more than 1 image exists */}
      {images.length > 1 ? (
        <div>
          <p className="text-ink-muted mb-2 text-xs font-semibold uppercase tracking-wider">
            Product Gallery ({images.length} views)
          </p>
          <div className="flex flex-wrap gap-3">
            {images.map((image, index) => {
              const isSelected = activeImage?.id === image.id;

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={cn(
                    "relative size-20 sm:size-24 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 bg-brand-50/50",
                    isSelected
                      ? "border-brand-600 ring-4 ring-brand-100 shadow-md scale-102"
                      : "border-brand-100 opacity-70 hover:opacity-100 hover:border-brand-300",
                  )}
                  aria-label={`View product image ${index + 1}`}
                  aria-pressed={isSelected}
                >
                  <Image
                    src={image.url}
                    alt={image.alt_text || `${name} view ${index + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                  {image.is_primary ? (
                    <span className="bg-ink/75 absolute bottom-1 right-1 rounded px-1 text-[9px] font-bold text-white uppercase tracking-wider">
                      Main
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
