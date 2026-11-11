"use client";

import { useProductReviewSummary } from "../hooks";
import { StarRatingDisplay } from "./star-rating";

export interface ProductRatingOverviewProps {
  productSlug: string;
  reviewsHref?: string;
}

export function ProductRatingOverview({
  productSlug,
  reviewsHref = "#product-reviews",
}: ProductRatingOverviewProps) {
  const summaryQuery = useProductReviewSummary(productSlug);
  const summary = summaryQuery.data;

  if (summaryQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <StarRatingDisplay rating={0} size="sm" label="Loading product ratings" />
        <a
          href={reviewsHref}
          className="text-brand-700 hover:text-brand-800 font-semibold underline underline-offset-4"
        >
          Customer reviews
        </a>
      </div>
    );
  }

  if (!summary || summary.total_reviews === 0) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <StarRatingDisplay rating={0} size="sm" label="No reviews yet" />
        <a
          href={reviewsHref}
          className="text-brand-700 hover:text-brand-800 font-semibold underline underline-offset-4"
        >
          No reviews yet
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 text-sm">
      <div className="flex items-center gap-1.5">
        <StarRatingDisplay
          rating={summary.average_rating}
          size="sm"
          label={`Average rating ${summary.average_rating.toFixed(1)} out of 5 stars`}
        />
        <span className="text-ink font-bold tabular-nums">
          {summary.average_rating.toFixed(1)}
        </span>
      </div>
      <span className="text-line" aria-hidden="true">
        •
      </span>
      <a
        href={reviewsHref}
        className="text-brand-700 hover:text-brand-800 font-semibold underline underline-offset-4"
      >
        {summary.total_reviews} customer{" "}
        {summary.total_reviews === 1 ? "review" : "reviews"}
      </a>
    </div>
  );
}

