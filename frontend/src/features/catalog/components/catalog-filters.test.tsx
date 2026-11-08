import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MultiSelectDropdown, SelectDropdown } from "@/components/ui";
import { CatalogFilters } from "@/features/catalog/components/catalog-filters";
import type {
  CatalogCategory,
  CatalogFacets,
  CatalogQuery,
} from "@/features/catalog/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Filter Components & CatalogFilters", () => {
  describe("SelectDropdown", () => {
    it("renders trigger with chevron and toggles options list", () => {
      const onChange = vi.fn();
      const options = [
        { value: "a", label: "Option A" },
        { value: "b", label: "Option B" },
      ];

      render(
        <SelectDropdown
          value="a"
          onChange={onChange}
          options={options}
          placeholder="Choose"
        />,
      );

      expect(screen.getByRole("button", { name: /option a/i })).toBeInTheDocument();
      // Click to open
      fireEvent.click(screen.getByRole("button", { name: /option a/i }));

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      const optionB = screen.getByRole("option", { name: /option b/i });
      fireEvent.click(optionB);

      expect(onChange).toHaveBeenCalledWith("b");
    });
  });

  describe("MultiSelectDropdown", () => {
    it("supports multiple selections and clear action", () => {
      const onChange = vi.fn();
      const options = [
        { value: "eyeliner", label: "Eyeliner" },
        { value: "lipstick", label: "Lipstick" },
        { value: "serum", label: "Serum" },
      ];

      const { rerender } = render(
        <MultiSelectDropdown
          values={[]}
          onChange={onChange}
          options={options}
          placeholder="All subcategories"
        />,
      );

      expect(screen.getByText("All subcategories")).toBeInTheDocument();

      // Open dropdown
      fireEvent.click(screen.getByRole("button", { name: /all subcategories/i }));
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      // Select Eyeliner
      fireEvent.click(screen.getByRole("option", { name: /eyeliner/i }));
      expect(onChange).toHaveBeenCalledWith(["eyeliner"]);

      // Rerender with 2 selected
      rerender(
        <MultiSelectDropdown
          values={["eyeliner", "lipstick"]}
          onChange={onChange}
          options={options}
          placeholder="All subcategories"
        />,
      );

      expect(screen.getByText("2 selected")).toBeInTheDocument();

      // Click clear button
      const clearBtn = screen.getByRole("button", { name: /clear selection/i });
      fireEvent.click(clearBtn);
      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe("CatalogFilters Integration", () => {
    it("renders filter controls with multiple subcategories and brands", () => {
      const categories: CatalogCategory[] = [
        {
          id: 1,
          parent_id: null,
          name: "Makeup",
          slug: "makeup",
          description: null,
          subcategories: [
            {
              id: 2,
              parent_id: 1,
              name: "Eyeliner",
              slug: "eyeliner",
              description: null,
            },
            {
              id: 3,
              parent_id: 1,
              name: "Lipstick",
              slug: "lipstick",
              description: null,
            },
          ],
        },
      ];

      const facets: CatalogFacets = {
        brands: [
          { id: 10, name: "Botanica Lab", slug: "botanica-lab" },
          { id: 11, name: "GlowCare", slug: "glowcare" },
        ],
        attributes: [],
      };

      const query: CatalogQuery = {
        sort: "newest",
        page: 1,
        perPage: 20,
        subcategories: ["eyeliner"],
        brands: ["botanica-lab"],
      };

      render(
        <CatalogFilters
          categories={categories}
          facets={facets}
          pathname="/products"
          query={query}
        />,
      );

      expect(screen.getByText("Filter products")).toBeInTheDocument();
      expect(screen.getByText("Eyeliner")).toBeInTheDocument();
      expect(screen.getByText("Botanica Lab")).toBeInTheDocument();
      expect(screen.getByText("Price range (৳)")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
    });
  });
});

