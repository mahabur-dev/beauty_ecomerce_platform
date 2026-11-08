import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  isRouteActive,
  PrimaryNavigation,
} from "@/components/layout/primary-navigation";

let currentPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

describe("isRouteActive", () => {
  it("matches root route only on exact match", () => {
    expect(isRouteActive("/", "/")).toBe(true);
    expect(isRouteActive("/categories", "/")).toBe(false);
    expect(isRouteActive("/brands", "/")).toBe(false);
  });

  it("matches nested routes for categories", () => {
    expect(isRouteActive("/categories", "/categories")).toBe(true);
    expect(isRouteActive("/categories/makeup", "/categories")).toBe(true);
    expect(isRouteActive("/brands", "/categories")).toBe(false);
  });

  it("matches nested routes for brands", () => {
    expect(isRouteActive("/brands", "/brands")).toBe(true);
    expect(isRouteActive("/brands/loreal", "/brands")).toBe(true);
    expect(isRouteActive("/categories", "/brands")).toBe(false);
  });
});

describe("PrimaryNavigation", () => {
  it("sets active styling on Home when at /", () => {
    currentPathname = "/";
    render(<PrimaryNavigation />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    const categoriesLink = screen.getByRole("link", { name: "Categories" });

    expect(homeLink).toHaveAttribute("aria-current", "page");
    expect(homeLink).toHaveClass("border-b-2");
    expect(categoriesLink).not.toHaveAttribute("aria-current");
    expect(categoriesLink).not.toHaveClass("border-b-2");
  });

  it("sets active styling on Categories when at /categories or /categories/makeup", () => {
    currentPathname = "/categories/makeup";
    render(<PrimaryNavigation />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    const categoriesLink = screen.getByRole("link", { name: "Categories" });

    expect(homeLink).not.toHaveAttribute("aria-current");
    expect(homeLink).not.toHaveClass("border-b-2");
    expect(categoriesLink).toHaveAttribute("aria-current", "page");
    expect(categoriesLink).toHaveClass("border-b-2");
  });

  it("sets active styling on Brands when at /brands", () => {
    currentPathname = "/brands";
    render(<PrimaryNavigation />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    const brandsLink = screen.getByRole("link", { name: "Brands" });

    expect(homeLink).not.toHaveAttribute("aria-current");
    expect(brandsLink).toHaveAttribute("aria-current", "page");
    expect(brandsLink).toHaveClass("border-b-2");
  });
});

