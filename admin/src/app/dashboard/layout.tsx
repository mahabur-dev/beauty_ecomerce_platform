"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { AppShell } from "@/components/app-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
