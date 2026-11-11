import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as catalogApi from "../api";
import type { CatalogCategory } from "../types";
import { CategoryDirectory } from "./catalog-directory";

function makeCategories(start: number, count: number): CatalogCategory[] {
  return Array.from({ length: count }, (_, idx) => {
    const id = start + idx;
    return {
      id,
      parent_id: null,
      name: `Category ${id}`,
      slug: `category-${id}`,
      description: null,
      image:
        id === 1
          ? {
              url: "https://res.cloudinary.com/demo/image/upload/cat-1.jpg",
              format: "jpg",
              width: 800,
              height: 800,
            }
          : null,
      subcategories: [],
    };
  });
}

describe("CategoryDirectory", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all categories using the 5-per-row CategoryCard grid across pages", async () => {
    const getCategoriesSpy = vi
      .spyOn(catalogApi, "getCategories")
      .mockResolvedValueOnce({
        data: makeCategories(1, 6),
        meta: {
          current_page: 1,
          from: 1,
          last_page: 2,
          per_page: 6,
          to: 6,
          total: 8,
        },
      })
      .mockResolvedValueOnce({
        data: makeCategories(7, 2),
        meta: {
          current_page: 2,
          from: 7,
          last_page: 2,
          per_page: 6,
          to: 8,
          total: 8,
        },
      });

    render(await CategoryDirectory());

    expect(getCategoriesSpy).toHaveBeenCalledTimes(2);
    const grid = screen.getByTestId("categories-directory-grid");
    expect(grid).toHaveClass("lg:grid-cols-5");

    for (let id = 1; id <= 8; id += 1) {
      expect(screen.getByText(`Category ${id}`)).toBeInTheDocument();
    }

    expect(screen.getByRole("img", { name: "Category 1" })).toHaveAttribute(
      "src",
      expect.stringContaining("res.cloudinary.com"),
    );
  });
});

