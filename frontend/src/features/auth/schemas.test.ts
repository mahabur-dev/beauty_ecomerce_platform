import { describe, expect, it } from "vitest";

import { registerSchema, resetPasswordSchema } from "./schemas";

const strongPassword = "Strong!Password123";

describe("auth schemas", () => {
  it("accepts a backend-compatible customer registration", () => {
    const result = registerSchema.safeParse({
      name: "  Customer One  ",
      email: "  CUSTOMER@example.com ",
      password: strongPassword,
      password_confirmation: strongPassword,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Customer One");
      expect(result.data.email).toBe("CUSTOMER@example.com");
    }
  });

  it("rejects weak and mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      email: "customer@example.com",
      token: "reset-token",
      password: "weak",
      password_confirmation: "different",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.password?.length).toBeGreaterThan(0);
      expect(fields.password_confirmation).toContain("Passwords do not match.");
    }
  });
});
