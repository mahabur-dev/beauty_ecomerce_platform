import type { AdminRole, AdminUser } from "@/features/auth/types";

export type Permission =
  | "catalog.categories.read"
  | "catalog.categories.write"
  | "catalog.products.read"
  | "catalog.products.write"
  | "catalog.global-data.write"
  | "identity.staff.manage"
  | "audit.read";

const rolePermissions: Readonly<Record<AdminRole, ReadonlySet<Permission>>> = {
  super_admin: new Set<Permission>([
    "catalog.categories.read",
    "catalog.categories.write",
    "catalog.products.read",
    "catalog.products.write",
    "catalog.global-data.write",
    "identity.staff.manage",
    "audit.read",
  ]),
  catalog_manager: new Set<Permission>([
    "catalog.categories.read",
    "catalog.categories.write",
    "catalog.products.read",
    "catalog.products.write",
  ]),
};

function isAdminRole(role: AdminUser["roles"][number]): role is AdminRole {
  return role === "super_admin" || role === "catalog_manager";
}

export function hasPermission(
  user: AdminUser,
  permission: Permission,
): boolean {
  return user.roles
    .filter(isAdminRole)
    .some((role) => rolePermissions[role].has(permission));
}
