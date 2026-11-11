"use client";

import { Icon } from "@/components/ui/icon";

export function ReviewStars({
  rating,
  size = 14,
  showNumeric = false,
}: {
  rating: number;
  size?: number;
  showNumeric?: boolean;
}) {
  const clamped = Math.max(0, Math.min(5, rating));

  return (
    <span
      className="reviews-stars"
      role="img"
      aria-label={`${clamped} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="star"
          size={size}
          className={
            star <= clamped ? "reviews-star-filled" : "reviews-star-empty"
          }
        />
      ))}
      {showNumeric ? (
        <span className="ml-1 text-xs font-semibold text-slate-700">
          {clamped}/5
        </span>
      ) : null}
    </span>
  );
}

