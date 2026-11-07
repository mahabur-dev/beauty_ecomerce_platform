import { describe, expect, it } from "vitest";

import {
  catalogPageHref,
  catalogQueryString,
  parseCatalogQuery,
} from "@/features/catalog/query";

describe("catalog query utilities", () => {
  it("normalizes invalid URL input to safe defaults", () => {
    expect(
      parseCatalogQuery({
        page: "-2",
        sort: "unknown",
        min_price: "20",
        max_price: "10",
      }),
    ).toMatchObject({
      page: 1,
      perPage: 20,
      sort: "newest",
      minPrice: "20",
      maxPrice: undefined,
    });
  });

  it("deduplicates attribute filters and serializes the backend contract", () => {
    const query = parseCatalogQuery({
      search: " serum ",
      attributes: ["4", "4", "7"],
      sort: "price_asc",
    });

    expect(query.attributeValueIds).toEqual([4, 7]);
    expect(catalogQueryString(query)).toContain("attribute_value_ids=4%2C7");
    expect(catalogQueryString(query)).toContain("search=serum");
  });

  it("preserves filters while changing pages", () => {
    const query = parseCatalogQuery({ brand: "aurora", page: "2" });
    expect(catalogPageHref("/products", query, 3)).toBe(
      "/products?brand=aurora&page=3",
    );
  });
});
