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
        "border-line bg-surface-elevated flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <span className="bg-brand-50 text-brand-700 grid size-12 place-items-center rounded-full">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-ink mt-4 text-lg font-bold">{title}</h2>
      <p className="text-ink-muted mt-2 max-w-md text-sm leading-6">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
