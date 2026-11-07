import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils/cn";

describe("cn", () => {
  it("merges conditional and conflicting utility classes", () => {
    expect(cn("px-2", false && "hidden", "px-4")).toBe("px-4");
  });
});
