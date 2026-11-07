"use client";

import type { ReactNode } from "react";
import { hasPermission, type Permission } from "@/features/auth/permissions";
import { useAdmin } from "@/features/auth/use-admin";

export function PermissionGate({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { data } = useAdmin();
  if (!data || !hasPermission(data, permission))
    return (
      <section role="alert">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p>You do not have permission to view this module.</p>
      </section>
    );
  return <>{children}</>;
}
