import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

interface LoadingStateProps {
  count?: number;
  className?: string;
}

export function LoadingState({ count = 4, className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
      aria-busy="true"
      aria-label="Loading content"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="border-line bg-surface-elevated rounded-xl border p-4"
        >
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="mt-4 h-4 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
