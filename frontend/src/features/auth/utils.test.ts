import { describe, expect, it } from "vitest";

import {
  buildAuthHrefWithNext,
  buildLoginHrefForLocation,
  resolveReferrerReturnPath,
  safeReturnPath,
} from "./utils";

describe("safeReturnPath", () => {
  it("keeps local application paths including root and query strings", () => {
    expect(safeReturnPath("/")).toBe("/");
    expect(safeReturnPath("/account/orders")).toBe("/account/orders");
    expect(safeReturnPath("/products/glow-serum?shade=rose")).toBe(
      "/products/glow-serum?shade=rose",
    );
    expect(safeReturnPath("/verify-email?next=/products/glow-serum")).toBe(
      "/verify-email?next=/products/glow-serum",
    );
  });

  it.each([
    undefined,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/login",
    "/login?next=/products",
    "/register",
    "/forgot-password",
    "/reset-password",
  ])("rejects an unsafe or auth-loop redirect target: %s", (value) => {
    expect(safeReturnPath(value)).toBe("/account");
  });
});

describe("buildLoginHrefForLocation", () => {
  it("captures the active storefront path and query string as next", () => {
    expect(buildLoginHrefForLocation("/")).toBe("/login?next=%2F");
    expect(
      buildLoginHrefForLocation("/products/glow-serum", "variant=2"),
    ).toBe("/login?next=%2Fproducts%2Fglow-serum%3Fvariant%3D2");
  });

  it("preserves an existing next query parameter when already on auth routes", () => {
    expect(
      buildLoginHrefForLocation("/register", "next=%2Fcatalog", "/catalog"),
    ).toBe("/login?next=%2Fcatalog");
    expect(buildLoginHrefForLocation("/login", "", null)).toBe("/login");
  });
});

describe("buildAuthHrefWithNext", () => {
  it("forwards valid next paths between auth pages", () => {
    expect(buildAuthHrefWithNext("/register", "/products/serum")).toBe(
      "/register?next=%2Fproducts%2Fserum",
    );
    expect(buildAuthHrefWithNext("/login", "//evil.test")).toBe("/login");
    expect(buildAuthHrefWithNext("/verify-email", "/login")).toBe(
      "/verify-email",
    );
  });
});

describe("resolveReferrerReturnPath", () => {
  it("returns same-origin storefront referrer paths and ignores auth or external URLs", () => {
    expect(
      resolveReferrerReturnPath(
        "https://shop.example.com/products/serum?shade=1",
        "https://shop.example.com",
      ),
    ).toBe("/products/serum?shade=1");
    expect(
      resolveReferrerReturnPath(
        "https://shop.example.com/register",
        "https://shop.example.com",
      ),
    ).toBeUndefined();
    expect(
      resolveReferrerReturnPath(
        "https://evil.example.com/products/serum",
        "https://shop.example.com",
      ),
    ).toBeUndefined();
  });
});
