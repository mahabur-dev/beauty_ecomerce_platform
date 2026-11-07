import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { slugify } from "./api";
import { CatalogTabs, Pagination, StatusBadge } from "./components/catalog-ui";

describe("catalog design foundation", () => {
  it("creates stable slugs and renders shared status UI", () => {
    expect(slugify("  Vitamin C & Glow  ")).toBe("vitamin-c-glow");
    render(<StatusBadge value="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
  it("disables previous/next at pagination boundaries", () => {
    render(<Pagination count={3} page={1} onPageChange={() => {}} />);
    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });
  it("links all catalog tabs to distinct routes", () => {
    render(<CatalogTabs active="products" />);
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute(
      "href",
      "/dashboard/products",
    );
    expect(screen.getByRole("link", { name: "Subcategories" })).toHaveAttribute(
      "href",
      "/dashboard/subcategories",
    );
  });
});
