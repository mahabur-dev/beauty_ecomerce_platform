import { ShoppingCart } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { SearchForm } from "@/components/layout/search-form";
import { Badge, Container } from "@/components/ui";
import { primaryNavigation } from "@/config/navigation";
import { HeaderAccount } from "@/features/auth";

export function SiteHeader() {
  return (
    <header className="relative z-30 bg-[#fff7f7]">
      <div>
        <Container className="flex h-20 items-center gap-3 lg:h-24 lg:gap-5">
          <MobileNavigation />
          <BrandLogo className="shrink-0" compactOnMobile />
          <nav
            className="ml-auto hidden lg:block"
            aria-label="Primary navigation"
          >
            <ul className="flex items-center gap-1 xl:gap-2">
              {primaryNavigation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={
                      item.href === "/"
                        ? "text-brand-700 border-brand-600 block border-b-2 px-3 py-3 text-sm font-semibold"
                        : "text-ink hover:text-brand-700 focus-visible:outline-brand-600 block px-3 py-3 text-sm font-semibold transition-colors focus-visible:rounded-md focus-visible:outline-2"
                    }
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <SearchForm className="ml-auto hidden w-56 xl:block" />
          <HeaderAccount />
          <a
            href="/cart"
            aria-label="Cart"
            className="bg-brand-600 hover:bg-brand-700 focus-visible:outline-brand-600 relative grid size-11 shrink-0 place-items-center rounded-full text-white transition focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
            <Badge className="border-surface-elevated bg-brand-600 absolute -top-1 -right-1 min-w-5 justify-center border-2 px-1 py-0 text-[10px] leading-4 text-white ring-0">
              3
            </Badge>
          </a>
        </Container>
      </div>
      <Container className="pb-3 lg:hidden">
        <SearchForm compact />
      </Container>
    </header>
  );
}
