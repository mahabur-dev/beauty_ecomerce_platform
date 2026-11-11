import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountActions } from "./components/account-actions";
import { AccountView } from "./components/account-view";
import { HeaderAccount } from "./components/header-account";
import { LoginForm } from "./components/login-form";
import * as authApi from "./api";
import type { AuthUser } from "./types";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();
let mockPathname = "/products/glow-serum";
let mockSearchParams = new URLSearchParams("variant=2");

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
    refresh: mockRefresh,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

const sampleUser: AuthUser = {
  id: 42,
  name: "Ayesha Rahman",
  email: "ayesha@example.com",
  email_verified: true,
  is_active: true,
  vendor_id: null,
  roles: ["customer"],
  mfa_enabled: false,
};

function renderWithQueryClient(ui: ReactNode, initialUser?: AuthUser | null) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  if (initialUser !== undefined) {
    client.setQueryData(["auth", "current-user"], initialUser);
  }

  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("storefront authentication redirect flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockReplace.mockReset();
    mockRefresh.mockReset();
    mockPathname = "/products/glow-serum";
    mockSearchParams = new URLSearchParams("variant=2");
  });

  it("links header sign-in icon back to the active page via ?next=", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(null);

    renderWithQueryClient(<HeaderAccount />, null);

    const link = await screen.findByRole("link", { name: "Sign in" });
    expect(link).toHaveAttribute(
      "href",
      "/login?next=%2Fproducts%2Fglow-serum%3Fvariant%3D2",
    );
  });

  it("returns to the originating page after customer login succeeds", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(null);
    vi.spyOn(authApi, "login").mockResolvedValue(sampleUser);
    mockPathname = "/login";
    mockSearchParams = new URLSearchParams(
      "next=%2Fproducts%2Fglow-serum%3Fvariant%3D2",
    );

    renderWithQueryClient(<LoginForm />, null);

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "ayesha@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "Enterprise!Pass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in securely" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/products/glow-serum?variant=2",
      );
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("redirects an already signed-in customer back to the requested page", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(sampleUser);
    mockPathname = "/login";
    mockSearchParams = new URLSearchParams("next=%2Fcatalog");

    renderWithQueryClient(<LoginForm />, sampleUser);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/catalog");
    });
  });

  it("renders AccountView client-side using cross-origin session and redirects only when unauthenticated", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(sampleUser);

    renderWithQueryClient(<AccountView />, sampleUser);

    expect(
      await screen.findByRole("heading", { name: "Welcome, Ayesha Rahman" }),
    ).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated visitors from AccountView to /login?next=%2Faccount", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(null);

    renderWithQueryClient(<AccountView />, null);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Faccount");
    });
  });

  it("renders a brand-aligned red Sign out button in AccountActions and logs out cleanly", async () => {
    const logoutSpy = vi.spyOn(authApi, "logout").mockResolvedValue(undefined);

    renderWithQueryClient(<AccountActions emailVerified />, sampleUser);

    const signOutButton = screen.getByRole("button", { name: "Sign out" });
    expect(signOutButton).toHaveClass("bg-danger-600", "text-white");

    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
    expect(mockRefresh).toHaveBeenCalled();
  });
});
