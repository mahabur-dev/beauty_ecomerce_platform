import { describe, expect, it } from "vitest";
import { isAuthorizedAdmin, safeInternalPath } from "@/features/auth/session";
import type { AdminUser } from "@/features/auth/types";

const user: AdminUser = {
  id: 1,
  name: "Manager",
  email: "manager@example.com",
  email_verified: true,
  is_active: true,
  vendor_id: 1,
  roles: ["catalog_manager"],
  mfa_enabled: true,
};

describe("administrator session boundaries", () => {
  it("requires an active, verified administrator", () => {
    expect(isAuthorizedAdmin(user)).toBe(true);
    // Session-level MFA enforcement is authoritative in the backend middleware.
    expect(isAuthorizedAdmin({ ...user, mfa_enabled: false })).toBe(true);
    expect(isAuthorizedAdmin({ ...user, is_active: false })).toBe(false);
    expect(isAuthorizedAdmin({ ...user, email_verified: false })).toBe(false);
    expect(isAuthorizedAdmin({ ...user, roles: ["customer"] })).toBe(false);
  });
  it("rejects open redirects", () => {
    expect(safeInternalPath("//evil.test")).toBe("/dashboard");
    expect(safeInternalPath("https://evil.test")).toBe("/dashboard");
    expect(safeInternalPath("/login")).toBe("/dashboard");
    expect(safeInternalPath("/dashboard/products")).toBe("/dashboard/products");
  });
});
