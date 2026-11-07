import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

interface StorefrontShellProps {
  children: ReactNode;
}

export function StorefrontShell({ children }: StorefrontShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="bg-brand-700 fixed top-[-100%] left-3 z-50 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:top-3 focus:outline-2 focus:outline-offset-2 focus:outline-white"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
