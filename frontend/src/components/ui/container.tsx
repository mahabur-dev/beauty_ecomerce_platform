import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "max-w-content mx-auto w-full px-4 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    />
  );
}
