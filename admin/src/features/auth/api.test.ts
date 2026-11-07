import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentAdmin, loginAdmin } from "@/features/auth/api";
import { ApiContractError } from "@/lib/api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("administrator authentication API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.cookie = "XSRF-TOKEN=; Max-Age=0; Path=/";
  });

  it("sends a credentialed, CSRF-protected admin login request", async () => {
    document.cookie = "XSRF-TOKEN=csrf-token; Path=/";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ next: "mfa_setup" }, 202));

    await expect(
      loginAdmin({ email: "admin@example.com", password: "secret" }),
    ).resolves.toEqual({ next: "mfa_setup" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("http://localhost:8000/api/v1/admin/auth/login");
    expect(request).toMatchObject({ method: "POST", credentials: "include" });
    expect(new Headers(request?.headers).get("X-XSRF-TOKEN")).toBe(
      "csrf-token",
    );
  });

  it("unwraps and validates the current administrator resource", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
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
      }),
    );

    await expect(getCurrentAdmin()).resolves.toMatchObject({
      id: 1,
      roles: ["customer", "super_admin"],
    });
  });

  it("rejects an unexpected backend authentication contract", async () => {
    document.cookie = "XSRF-TOKEN=csrf-token; Path=/";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ next: "dashboard" }, 202),
    );

    await expect(
      loginAdmin({ email: "admin@example.com", password: "secret" }),
    ).rejects.toBeInstanceOf(ApiContractError);
  });
});
