import type { AdminUser } from "@/features/auth/types";

export function isAuthorizedAdmin(user: AdminUser): boolean {
  return (
    user.is_active &&
    user.email_verified &&
    // [MFA FEATURE - TEMPORARILY DISABLED]
    // Uncomment when re-enabling MFA:
    // user.mfa_enabled &&
    user.roles.some(
      (role) => role === "super_admin" || role === "catalog_manager",
    )
  );
}

export function safeInternalPath(path: string | null | undefined): string {
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\")
  ) {
    return "/dashboard";
  }
  // Only allow post-login destinations inside protected routes.
  return path === "/dashboard" || path.startsWith("/dashboard/")
    ? path
    : "/dashboard";
}
