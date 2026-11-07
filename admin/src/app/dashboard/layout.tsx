"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { CatalogDemoProvider } from "@/features/catalog/demo-store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <CatalogDemoProvider>
        <AppShell>{children}</AppShell>
      </CatalogDemoProvider>
    </AuthGuard>
  );
}
