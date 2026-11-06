import { describe, expect, it } from "vitest";

import { safeReturnPath } from "./utils";

describe("safeReturnPath", () => {
  it("keeps local application paths", () => {
    expect(safeReturnPath("/account/orders")).toBe("/account/orders");
  });

  it.each([undefined, "https://evil.example", "//evil.example"])(
    "rejects an unsafe redirect target: %s",
    (value) => {
      expect(safeReturnPath(value)).toBe("/account");
    },
  );
});
