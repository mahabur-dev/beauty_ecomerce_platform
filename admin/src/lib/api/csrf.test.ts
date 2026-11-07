import { afterEach, describe, expect, it } from "vitest";

import { clearCsrfCookie, readCookie, resetCsrfState } from "@/lib/api/csrf";

describe("CSRF cookie support", () => {
  afterEach(() => {
    document.cookie = "XSRF-TOKEN=; Max-Age=0; Path=/";
    resetCsrfState();
  });

  it("decodes Laravel's XSRF cookie", () => {
    document.cookie = "XSRF-TOKEN=token%3Dvalue; Path=/";
    expect(readCookie("XSRF-TOKEN")).toBe("token=value");
  });

  it("removes the token when a session ends", () => {
    document.cookie = "XSRF-TOKEN=temporary; Path=/";
    clearCsrfCookie();
    expect(readCookie("XSRF-TOKEN")).toBeUndefined();
  });
});
