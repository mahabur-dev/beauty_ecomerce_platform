import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonStyles } from "@/components/ui";
import { catalogPageHref } from "@/features/catalog/query";
import type { CatalogQuery } from "@/features/catalog/types";
import type { PaginationMeta } from "@/types/api";
import { cn } from "@/lib/utils/cn";

function visiblePages(current: number, last: number): number[] {
  const pages = new Set([1, last, current - 1, current, current + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= last)
    .sort((a, b) => a - b);
}

export function CatalogPagination({
  meta,
  pathname,
  query,
}: {
  meta: PaginationMeta;
  pathname: string;
  query: CatalogQuery;
}) {
  if (meta.last_page <= 1) return null;

  const pages = visiblePages(meta.current_page, meta.last_page);

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
      aria-label="Product pages"
    >
      <a
        href={catalogPageHref(
          pathname,
          query,
          Math.max(1, meta.current_page - 1),
        )}
        aria-disabled={meta.current_page === 1}
        className={buttonStyles({
          variant: "outline",
          size: "sm",
          className: cn(
            meta.current_page === 1 && "pointer-events-none opacity-50",
          ),
        })}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Previous
      </a>

      {pages.map((page, index) => {
        const previous = pages[index - 1];
        return (
          <span key={page} className="contents">
            {previous !== undefined && page - previous > 1 ? (
              <span className="text-ink-muted px-1" aria-hidden="true">
                …
              </span>
            ) : null}
            <a
              href={catalogPageHref(pathname, query, page)}
              aria-current={page === meta.current_page ? "page" : undefined}
              className={buttonStyles({
                variant: page === meta.current_page ? "primary" : "outline",
                size: "sm",
                className: "min-w-9 px-3",
              })}
            >
              {page}
            </a>
          </span>
        );
      })}

      <a
        href={catalogPageHref(
          pathname,
          query,
          Math.min(meta.last_page, meta.current_page + 1),
        )}
        aria-disabled={meta.current_page === meta.last_page}
        className={buttonStyles({
          variant: "outline",
          size: "sm",
          className: cn(
            meta.current_page === meta.last_page &&
              "pointer-events-none opacity-50",
          ),
        })}
      >
        Next
        <ChevronRight className="size-4" aria-hidden="true" />
      </a>
    </nav>
  );
}
