import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/lib/api/client";

describe("apiRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON requests with first-party credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: 1 } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiRequest<{ data: { id: number } }>("/products", {
        method: "POST",
        json: { name: "Serum" },
      }),
    ).resolves.toEqual({ data: { id: 1 } });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/products",
      expect.objectContaining({
        body: JSON.stringify({ name: "Serum" }),
        credentials: "include",
        method: "POST",
      }),
    );
  });

  it("maps problem+json responses to ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            title: "Validation failed",
            status: 422,
            detail: "The given data was invalid.",
            request_id: "request-123",
          }),
          {
            status: 422,
            headers: { "content-type": "application/problem+json" },
          },
        ),
      ),
    );

    const request = apiRequest("/products", { method: "POST", json: {} });

    await expect(request).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      message: "The given data was invalid.",
      problem: expect.objectContaining({ request_id: "request-123" }),
    });
  });
});
