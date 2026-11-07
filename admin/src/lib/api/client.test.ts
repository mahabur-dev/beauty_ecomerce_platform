import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/lib/api/client";
import { ApiError, apiErrorMessage } from "@/lib/api/errors";

describe("API rate-limit responses", () => {
  afterEach(() => vi.restoreAllMocks());

  it("preserves Retry-After and returns an actionable message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          title: "Rate limit exceeded",
          status: 429,
          detail: "Too many requests.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/problem+json",
            "Retry-After": "17",
          },
        },
      ),
    );

    const error = await apiRequest("/admin/catalog/summary").catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).problem.retry_after).toBe(17);
    expect(apiErrorMessage(error)).toBe(
      "Too many requests. Please try again in 17 seconds.",
    );
  });
});
