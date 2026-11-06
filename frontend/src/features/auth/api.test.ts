import { afterEach, describe, expect, it, vi } from "vitest";

import { env } from "@/config/env";

import { login } from "./api";

const user = {
  id: 7,
  name: "Customer One",
  email: "customer@example.com",
  email_verified: false,
  is_active: true,
  vendor_id: null,
  roles: ["customer"],
  mfa_enabled: false,
};

describe("auth API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = "XSRF-TOKEN=; Max-Age=0; path=/";
  });

  it("bootstraps CSRF before sending credentials", async () => {
    document.cookie = "XSRF-TOKEN=csrf-token; path=/";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ data: user }, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      login({
        email: "customer@example.com",
        password: "Strong!Password123",
        remember: true,
      }),
    ).resolves.toEqual(user);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${new URL(env.apiBaseUrl).origin}/sanctum/csrf-cookie`,
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${env.apiBaseUrl}/auth/login`,
      expect.objectContaining({
        credentials: "include",
        headers: expect.any(Headers),
        method: "POST",
      }),
    );

    const request = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(new Headers(request.headers).get("X-XSRF-TOKEN")).toBe("csrf-token");
  });
});
