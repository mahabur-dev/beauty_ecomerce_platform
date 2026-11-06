import { Leaf } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

interface BrandLogoProps {
  className?: string;
  inverted?: boolean;
  compactOnMobile?: boolean;
}

export function BrandLogo({
  className,
  compactOnMobile = false,
  inverted = false,
}: BrandLogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4",
        inverted
          ? "focus-visible:outline-white"
          : "focus-visible:outline-brand-600",
        className,
      )}
      aria-label={`${siteConfig.name} home`}
    >
      <span
        className={cn(
          "relative grid size-10 place-items-center transition-transform group-hover:-rotate-3",
          inverted ? "text-white" : "text-brand-600",
        )}
      >
        <Leaf
          className="absolute top-0.5 left-0 size-7 -rotate-35 fill-current"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <Leaf
          className="absolute top-0.5 right-0 size-7 rotate-35 fill-current"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <span className="absolute bottom-0 h-5 w-0.5 rounded-full bg-current" />
      </span>
      <span className={cn(compactOnMobile && "xs:block hidden")}>
        <span
          className={cn(
            "block text-xl leading-none font-extrabold tracking-tight sm:text-2xl",
            inverted ? "text-white" : "text-brand-700",
          )}
        >
          {siteConfig.name}
        </span>
        <span
          className={cn(
            "mt-1 block text-[11px] leading-none font-medium tracking-wide",
            inverted ? "text-white/65" : "text-ink-muted",
          )}
        >
          Health &amp; Beauty
        </span>
      </span>
    </Link>
  );
}
