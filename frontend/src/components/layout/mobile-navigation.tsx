"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, ShoppingBag, UserRound } from "lucide-react";
import { useState } from "react";

import { isRouteActive } from "@/components/layout/primary-navigation";
import { SearchForm } from "@/components/layout/search-form";
import { Button, Modal } from "@/components/ui";
import { customerNavigation, primaryNavigation } from "@/config/navigation";

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
            {customerNavigation.map((item, index) => {
              const Icon = [UserRound, ShoppingBag, Heart][index] ?? UserRound;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="border-line hover:border-brand-200 hover:bg-brand-50 flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors"
                >
                  <Icon
                    className="text-brand-700 size-4.5"
                    aria-hidden="true"
                  />
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>
      </Modal>
    </>
  );
}
