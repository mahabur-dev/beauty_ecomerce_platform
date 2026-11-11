"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Heart, LogIn, Menu, ShoppingBag, UserRound } from "lucide-react";
import { Suspense, useState } from "react";

import { isRouteActive } from "@/components/layout/primary-navigation";
import { SearchForm } from "@/components/layout/search-form";
import { Button, Modal } from "@/components/ui";
import { customerNavigation, primaryNavigation } from "@/config/navigation";
import { useCurrentUser } from "@/features/auth/hooks";
import { buildLoginHrefForLocation } from "@/features/auth/utils";

function MobileSignInLink({ onNavigate }: { onNavigate: () => void }) {
  const userQuery = useCurrentUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (userQuery.data) {
    return null;
  }

  const loginHref = buildLoginHrefForLocation(
    pathname,
    searchParams.toString(),
    searchParams.get("next"),
  );

  return (
    <Link
      href={loginHref}
      onClick={onNavigate}
      className="border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100 flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors"
    >
      <LogIn className="text-brand-700 size-4.5" aria-hidden="true" />
      Sign in
    </Link>
  );
}

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5.5" aria-hidden="true" />
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Browse GlowCare"
        description="Shop by category or manage your account."
        position="right"
      >
        <SearchForm compact />
        <nav className="mt-7" aria-label="Mobile primary navigation">
          <p className="text-ink-muted mb-2 text-xs font-bold tracking-wider uppercase">
            Shop
          </p>
          <ul className="divide-line divide-y">
            {primaryNavigation.map((item) => {
              const active = isRouteActive(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href as Route}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={
                      active
                        ? "text-brand-700 bg-brand-50 block rounded-xl px-3 py-3 text-sm font-bold"
                        : "text-ink hover:text-brand-700 block px-3 py-3 text-sm font-semibold transition-colors"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <nav className="mt-7" aria-label="Mobile customer navigation">
          <p className="text-ink-muted mb-3 text-xs font-bold tracking-wider uppercase">
            Your account
          </p>
          <div className="grid gap-2">
            <Suspense fallback={null}>
              <MobileSignInLink onNavigate={() => setOpen(false)} />
            </Suspense>
            {customerNavigation.map((item, index) => {
              const Icon = [UserRound, ShoppingBag, Heart][index] ?? UserRound;

              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  onClick={() => setOpen(false)}
                  className="border-line hover:border-brand-200 hover:bg-brand-50 flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors"
                >
                  <Icon
                    className="text-brand-700 size-4.5"
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </Modal>
    </>
  );
}
