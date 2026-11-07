import { Search } from "lucide-react";
import { useId } from "react";

interface SearchFormProps {
  className?: string;
  compact?: boolean;
}

export function SearchForm({ className, compact = false }: SearchFormProps) {
  const inputId = useId();

  return (
    <form action="/products" role="search" className={className}>
      <div className="border-brand-100 bg-surface-elevated focus-within:border-brand-400 focus-within:ring-brand-100 flex h-11 items-center rounded-full border pl-4 transition focus-within:ring-4">
        <label htmlFor={inputId} className="sr-only">
          Search products, brands and categories
        </label>
        <input
          id={inputId}
          type="search"
          name="search"
          placeholder={
            compact ? "Search products..." : "Search for products..."
          }
          className="text-ink placeholder:text-ink-muted min-w-0 flex-1 bg-transparent pr-2 text-xs outline-none sm:text-sm"
        />
        <button
          type="submit"
          className="text-brand-700 hover:bg-brand-50 focus-visible:outline-brand-600 mr-1 grid size-9 shrink-0 place-items-center rounded-full transition focus-visible:outline-2"
          aria-label="Submit search"
        >
          <Search className="size-4.5" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
