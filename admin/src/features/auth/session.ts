import type { AdminUser } from "@/features/auth/types";

export function isAuthorizedAdmin(user: AdminUser): boolean {
  return (
    user.is_active &&
    user.email_verified &&
    user.mfa_enabled &&
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
