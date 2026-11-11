import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/layout/site-header";
import * as authApi from "@/features/auth/api";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
}));

describe("SiteHeader", () => {
  it("renders a sticky top header navbar that stays fixed while scrolling", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(null);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(["auth", "current-user"], null);

    render(
      <QueryClientProvider client={client}>
        <SiteHeader />
      </QueryClientProvider>,
    );

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky", "top-0");
    expect(await screen.findByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });
});

