"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import type { RatingStarsKey, ReviewSummary } from "../types";
import { StarRatingDisplay } from "./star-rating";

export interface RatingSummaryProps {
  summary: ReviewSummary;
  activeRating?: number | null;
  onSelectRating?: (rating: number | null) => void;
}

const STAR_TIERS: readonly { key: RatingStarsKey; stars: number }[] = [
  { key: "5", stars: 5 },
  { key: "4", stars: 4 },
  { key: "3", stars: 3 },
  { key: "2", stars: 2 },
  { key: "1", stars: 1 },
];

export function RatingSummary({
  summary,
  activeRating = null,
  onSelectRating,
}: RatingSummaryProps) {
  const hasReviews = summary.total_reviews > 0;

  return (
    <div className="border-line bg-surface-elevated/80 shadow-soft grid grid-cols-1 gap-6 rounded-3xl border p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
      {/* Average Rating Score */}
      <div className="flex flex-col items-start gap-2.5 lg:col-span-4">
        <div className="flex items-baseline gap-2">
          <span className="text-ink text-4xl font-extrabold tracking-tight sm:text-5xl">
            {hasReviews ? summary.average_rating.toFixed(1) : "0.0"}
          </span>
          <span className="text-ink-muted text-sm font-semibold">/ 5</span>
        </div>

        <StarRatingDisplay
          rating={summary.average_rating}
          size="md"
          label={
            hasReviews
              ? `Average rating ${summary.average_rating.toFixed(1)} out of 5 stars`
              : "No approved reviews yet"
          }
        />

        {!hasReviews ? (
          <p className="text-ink-muted text-sm">
            No approved customer reviews yet
          </p>
        ) : null}
      </div>

      {/* Interactive 5★–1★ Distribution Bars */}
      <div
        className="space-y-2 lg:col-span-8"
        role="group"
        aria-label="Rating breakdown by stars"
      >
        {STAR_TIERS.map(({ key, stars }) => {
          const count = summary.distribution[key] ?? 0;
          const percentage =
            summary.total_reviews > 0
              ? Math.round((count / summary.total_reviews) * 100)
              : 0;
          const isSelected = activeRating === stars;

          return (
            <button
              key={key}
              type="button"
              disabled={!onSelectRating}
              aria-pressed={onSelectRating ? isSelected : undefined}
              onClick={() => {
                if (!onSelectRating) return;
                onSelectRating(isSelected ? null : stars);
              }}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-2.5 py-1.5 text-left text-sm transition-colors",
                onSelectRating
                  ? "hover:bg-brand-50/70 focus-visible:ring-brand-500 cursor-pointer focus-visible:ring-2 focus-visible:outline-none"
                  : "cursor-default",
                isSelected && "bg-brand-50 ring-brand-500 ring-1",
              )}
            >
              <span className="text-ink inline-flex w-14 shrink-0 items-center gap-1 font-semibold">
                <span>{stars}</span>
                <Star
                  className="size-3.5 fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
              </span>

              <span className="bg-surface-subtle border-line/70 relative h-2.5 flex-1 overflow-hidden rounded-full border">
                <span
                  className={cn(
                    "block h-full rounded-full transition-all duration-300",
                    isSelected ? "bg-brand-600" : "bg-amber-400",
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </span>

              <span className="text-ink-muted w-16 shrink-0 text-right text-xs font-medium tabular-nums">
                {count} ({percentage}%)
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

