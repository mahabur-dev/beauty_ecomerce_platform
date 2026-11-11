import { describe, expect, it } from "vitest";

import {
  adminLoginResponseSchema,
  adminLoginSchema,
  adminResourceResponseSchema,
  mfaChallengeSchema,
  mfaSetupResponseSchema,
} from "@/features/auth/schemas";

describe("admin authentication schemas", () => {
  it("normalizes an administrator email", () => {
    expect(
      adminLoginSchema.parse({
        email: " ADMIN@Example.COM ",
        password: "secret",
      }).email,
    ).toBe("admin@example.com");
  });

  it("requires exactly one MFA challenge method", () => {
    expect(mfaChallengeSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(
      mfaChallengeSchema.safeParse({ recovery_code: "recovery-code" }).success,
    ).toBe(true);
    expect(
      mfaChallengeSchema.safeParse({ code: "123456", recovery_code: "code" })
        .success,
    ).toBe(false);
    expect(mfaChallengeSchema.safeParse({}).success).toBe(false);
  });

  it("accepts the Laravel administrator resource contract", () => {
    expect(
      adminResourceResponseSchema.safeParse({
        data: {
          id: 1,
          name: "Mahabur",
          email: "admin@example.com",
          email_verified: true,
          is_active: true,
          vendor_id: null,
          roles: ["customer", "super_admin"],
          mfa_enabled: true,
        },
      }).success,
    ).toBe(true);
  });

  it("rejects unknown login and malformed MFA setup responses", () => {
    expect(
      adminLoginResponseSchema.safeParse({ next: "authenticated" }).success,
    ).toBe(true);
    expect(
      adminLoginResponseSchema.safeParse({ next: "dashboard" }).success,
    ).toBe(false);
    expect(
      mfaSetupResponseSchema.safeParse({
        secret: "secret",
        provisioning_uri: "https://example.com",
      }).success,
    ).toBe(false);
  });
});
