"use client";

import { Star } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils/cn";

const starLabels = [
  "1 star — Poor",
  "2 stars — Fair",
  "3 stars — Good",
  "4 stars — Very good",
  "5 stars — Excellent",
] as const;

export interface StarRatingDisplayProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const displaySizes = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const;

/**
 * Accessible read-only 5-star display supporting fractional average ratings.
 */
export function StarRatingDisplay({
  rating,
  size = "sm",
  label,
  className,
}: StarRatingDisplayProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const accessibleText =
    label ?? `${clamped.toFixed(clamped % 1 === 0 ? 0 : 1)} out of 5 stars`;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={accessibleText}
      role="img"
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fillRatio = Math.max(0, Math.min(1, clamped - index));
        const fillPercent = Math.round(fillRatio * 100);

        return (
          <span
            key={index}
            className={cn("relative inline-block shrink-0", displaySizes[size])}
            aria-hidden="true"
          >
            <Star
              className={cn(
                "text-slate-200 fill-slate-200",
                displaySizes[size],
              )}
            />
            {fillPercent > 0 ? (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercent}%` }}
              >
                <Star
                  className={cn(
                    "fill-amber-400 text-amber-400",
                    displaySizes[size],
                  )}
                />
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

export interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  label?: string;
  error?: string | undefined;
  id?: string;
}

/**
 * Keyboard-accessible 1–5 star rating selector implementing radiogroup semantics.
 */
export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  label = "Overall rating",
  error,
  id,
}: StarRatingInputProps) {
  const generatedId = useId();
  const groupId = id ?? generatedId;
  const labelId = `${groupId}-label`;
  const errorId = `${groupId}-error`;
  const [hoverValue, setHoverValue] = useState(0);

  const displayedRating = hoverValue > 0 ? hoverValue : value;

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    star: number,
  ) {
    if (disabled) return;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(Math.min(5, star + 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(Math.max(1, star - 1));
    }
  }

  return (
    <div className="space-y-2">
      <span
        id={labelId}
        className="text-ink block text-sm font-semibold"
      >
        {label}
        <span className="text-brand-600 ml-1" aria-hidden="true">
          *
        </span>
      </span>

      <div className="flex flex-wrap items-center gap-3">
        <div
          id={groupId}
          role="radiogroup"
          aria-labelledby={labelId}
          aria-describedby={error ? errorId : undefined}
          className="inline-flex items-center gap-1"
          onMouseLeave={() => setHoverValue(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isSelected = value === star;
            const isFilled = star <= displayedRating;

            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={starLabels[star - 1]}
                disabled={disabled}
                onClick={() => onChange(star)}
                onMouseEnter={() => setHoverValue(star)}
                onKeyDown={(event) => handleKeyDown(event, star)}
                className={cn(
                  "focus-visible:ring-brand-500 cursor-pointer rounded-lg p-1.5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <Star
                  className={cn(
                    "size-7 transition-colors",
                    isFilled
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-100 text-slate-300",
                  )}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        <span className="text-ink-muted text-sm font-medium">
          {value >= 1 && value <= 5
            ? starLabels[value - 1]
            : "Select a rating"}
        </span>
      </div>

      {error ? (
        <p id={errorId} className="text-danger-600 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

