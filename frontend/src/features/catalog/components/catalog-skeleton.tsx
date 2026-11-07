import { Skeleton } from "@/components/ui";

export function CatalogSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <Skeleton className="hidden h-[34rem] rounded-2xl lg:block" />
      <div>
        <div className="mb-5 flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-11 w-44" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: cards }, (_, index) => (
            <div
              key={index}
              className="border-line overflow-hidden rounded-2xl border bg-white"
            >
              <Skeleton className="aspect-square rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
