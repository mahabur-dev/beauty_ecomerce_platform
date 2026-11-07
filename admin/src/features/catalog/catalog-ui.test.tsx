import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CatalogDemoProvider,
  categorySeeds,
  productSeeds,
  slugify,
  useCatalogDemo,
} from "./demo-store";
import { CatalogTabs, Pagination, StatusBadge } from "./components/catalog-ui";
import { useState } from "react";

function DemoConsumer() {
  const {
    categories,
    products,
    upsertCategory,
    upsertProduct,
    removeCategory,
    removeProduct,
  } = useCatalogDemo();
  const [lastDeleteResult, setLastDeleteResult] = useState<boolean | null>(
    null,
  );
  return (
    <>
      <output data-testid="counts">
        {categories.length}/{products.length}
      </output>
      <output data-testid="delete-result">{String(lastDeleteResult)}</output>
      <button onClick={() => setLastDeleteResult(removeCategory("cat-1"))}>
        Delete parent
      </button>
      <button
        onClick={() =>
          upsertCategory({
            ...categorySeeds[0]!,
            id: "new",
            name: "New category",
          })
        }
      >
        Add category
      </button>
      <button
        onClick={() =>
          upsertProduct({ ...productSeeds[0]!, id: "new", name: "New product" })
        }
      >
        Add product
      </button>
      <button onClick={() => removeProduct("PRD-02011")}>Remove product</button>
    </>
  );
}

describe("catalog design foundation", () => {
  it("creates stable slugs and renders shared status UI", () => {
    expect(slugify("  Vitamin C & Glow  ")).toBe("vitamin-c-glow");
    render(<StatusBadge value="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
  it("keeps demo model edits in the shared provider and guards category relationships", () => {
    render(
      <CatalogDemoProvider>
        <DemoConsumer />
      </CatalogDemoProvider>,
    );
    expect(screen.getByTestId("counts")).toHaveTextContent(
      `${categorySeeds.length}/${productSeeds.length}`,
    );
    fireEvent.click(screen.getByText("Delete parent"));
    expect(screen.getByTestId("delete-result")).toHaveTextContent("false");
    fireEvent.click(screen.getByText("Add category"));
    fireEvent.click(screen.getByText("Add product"));
    expect(screen.getByTestId("counts")).toHaveTextContent(
      `${categorySeeds.length + 1}/${productSeeds.length + 1}`,
    );
    fireEvent.click(screen.getByText("Remove product"));
    expect(screen.getByTestId("counts")).toHaveTextContent(
      `${categorySeeds.length + 1}/${productSeeds.length}`,
    );
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
