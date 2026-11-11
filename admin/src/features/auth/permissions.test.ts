import { describe, expect, it } from "vitest";

import { hasPermission } from "@/features/auth/permissions";
import type { AdminUser } from "@/features/auth/types";

function adminWithRole(role: AdminUser["roles"][number]): AdminUser {
  return {
    id: 1,
    name: "Admin",
    email: "admin@example.com",
    email_verified: true,
    is_active: true,
    vendor_id: null,
    roles: ["customer", role],
    mfa_enabled: true,
  };
}

describe("admin permissions", () => {
  it("allows a catalog manager to manage products", () => {
    expect(
      hasPermission(adminWithRole("catalog_manager"), "catalog.products.write"),
    ).toBe(true);
  });

  it("keeps staff management restricted to super administrators", () => {
    expect(
      hasPermission(adminWithRole("catalog_manager"), "identity.staff.manage"),
    ).toBe(false);
    expect(
      hasPermission(adminWithRole("super_admin"), "identity.staff.manage"),
    ).toBe(true);
  });

  it("grants review moderation access to active admin roles", () => {
    expect(
      hasPermission(adminWithRole("catalog_manager"), "reviews.read"),
    ).toBe(true);
    expect(
      hasPermission(adminWithRole("catalog_manager"), "reviews.moderate"),
    ).toBe(true);
    expect(
      hasPermission(adminWithRole("super_admin"), "reviews.moderate"),
    ).toBe(true);
  });
});
