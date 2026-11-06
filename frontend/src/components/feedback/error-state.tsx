"use client";

import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  className,
  description = "We could not load this content. Please check your connection and try again.",
  onRetry,
  title = "Something went wrong",
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className={cn(
        "rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center",
        className,
      )}
    >
      <CircleAlert className="mx-auto size-7 text-red-600" aria-hidden="true" />
      <h2 className="text-ink mt-3 text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-red-800">{description}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </section>
  );
}
