import { describe, expect, it } from "vitest";

import { adminLoginSchema, mfaChallengeSchema } from "@/features/auth/schemas";

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
});
