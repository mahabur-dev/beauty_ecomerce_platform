"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import type { CatalogCategory } from "@/features/catalog/types";
import { cn } from "@/lib/utils/cn";

import { CategoryCard } from "./category-card";

const DESKTOP_VISIBLE_COUNT = 5;
const TABLET_VISIBLE_COUNT = 3;
const MOBILE_VISIBLE_COUNT = 2;

function resolveVisibleCount(width: number): number {
  if (width >= 1024) return DESKTOP_VISIBLE_COUNT;
  if (width >= 640) return TABLET_VISIBLE_COUNT;
  return MOBILE_VISIBLE_COUNT;
}

export interface CategoryCarouselProps {
  categories: CatalogCategory[];
}

/**
 * Renders storefront categories in a single horizontal row (5 per row on desktop),
 * revealing left/right shift arrows when more than 5 categories exist.
 */
export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const [visibleCount, setVisibleCount] = useState(DESKTOP_VISIBLE_COUNT);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    function handleResize() {
      setVisibleCount(resolveVisibleCount(window.innerWidth));
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showShiftControls = categories.length > DESKTOP_VISIBLE_COUNT;
  const maxIndex = Math.max(0, categories.length - visibleCount);
  const safeStartIndex = showShiftControls ? Math.min(startIndex, maxIndex) : 0;
  const stepPercent = 100 / visibleCount;

  const shiftBtnClasses =
    "border-brand-200 bg-surface-elevated/95 text-ink hover:border-brand-600 hover:bg-brand-600 focus-visible:outline-brand-600 absolute top-1/2 z-10 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border shadow-md backdrop-blur transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-brand-200 disabled:hover:bg-surface-elevated/95 disabled:hover:text-ink";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Product categories"
      className="relative"
    >
      {showShiftControls ? (
        <button
          type="button"
          aria-label="Previous categories"
          disabled={safeStartIndex === 0}
          onClick={() => setStartIndex((prev) => Math.max(0, Math.min(prev, maxIndex) - 1))}
          className={cn(shiftBtnClasses, "-left-3 lg:-left-5")}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
      ) : null}

      <div
        className={cn(
          "-mx-2",
          showShiftControls
            ? "overflow-hidden"
            : "overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] lg:overflow-hidden [&::-webkit-scrollbar]:hidden",
        )}
      >
        <div
          data-testid="category-carousel-track"
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${safeStartIndex * stepPercent}%)`,
          }}
        >
          {categories.map((category, idx) => (
            <div
              key={category.slug}
              onFocusCapture={() => {
                if (!showShiftControls) return;
                if (idx < safeStartIndex) {
                  setStartIndex(idx);
                } else if (idx >= safeStartIndex + visibleCount) {
                  setStartIndex(Math.min(maxIndex, idx - visibleCount + 1));
                }
              }}
              className="w-1/2 shrink-0 px-2 sm:w-1/3 lg:w-1/5"
            >
              <CategoryCard category={category} />
            </div>
          ))}
        </div>
      </div>

      {showShiftControls ? (
        <button
          type="button"
          aria-label="Next categories"
          disabled={safeStartIndex >= maxIndex}
          onClick={() => setStartIndex((prev) => Math.min(maxIndex, prev + 1))}
          className={cn(shiftBtnClasses, "-right-3 lg:-right-5")}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
