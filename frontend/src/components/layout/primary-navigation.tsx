"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { primaryNavigation } from "@/config/navigation";

export function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNavigation() {
  const pathname = usePathname();

  return (
    <nav className="ml-auto hidden lg:block" aria-label="Primary navigation">
      <ul className="flex items-center gap-1 xl:gap-2">
        {primaryNavigation.map((item) => {
          const active = isRouteActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href as Route}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "text-brand-700 border-brand-600 block border-b-2 px-3 py-3 text-sm font-semibold"
                    : "text-ink hover:text-brand-700 focus-visible:outline-brand-600 block px-3 py-3 text-sm font-semibold transition-colors focus-visible:rounded-md focus-visible:outline-2"
                }
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

