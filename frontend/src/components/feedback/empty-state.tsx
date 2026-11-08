import { PackageOpen, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function EmptyState({
  action,
  className,
  description,
  icon: Icon = PackageOpen,
  title,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "border-line bg-surface-elevated/80 shadow-soft flex flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-14 text-center sm:py-16",
        className,
      )}
    >
      <span className="bg-brand-50 text-brand-600 ring-8 ring-brand-50/60 grid size-16 place-items-center rounded-2xl shadow-xs">
        <Icon className="size-8" aria-hidden="true" />
      </span>
      <h2 className="text-ink mt-6 text-xl font-extrabold sm:text-2xl">{title}</h2>
      <p className="text-ink-muted mt-2.5 max-w-lg text-sm leading-relaxed sm:text-base">
        {description}
      </p>
      {action ? (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {action}
        </div>
      ) : null}
    </section>
  );
}
