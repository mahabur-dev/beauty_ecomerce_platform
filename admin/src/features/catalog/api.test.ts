import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createProduct,
  getCatalogOptions,
  getCatalogSummary,
  listCategories,
  listProducts,
} from "./api";
import { ApiContractError } from "@/lib/api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const meta = {
  current_page: 1,
  from: 1,
  last_page: 1,
  per_page: 20,
  to: 1,
  total: 1,
};

const category = {
  id: 10,
  parent_id: null,
  name: "Skin Care",
  slug: "skin-care",
  description: "Daily care",
  status: "active",
  sort_order: 0,
  children_count: 2,
  deleted_at: null,
  created_at: "2026-11-08T00:00:00.000000Z",
  updated_at: "2026-11-08T00:00:00.000000Z",
};

const product = {
  id: 25,
  vendor_id: 1,
  brand_id: null,
  primary_category_id: 11,
  name: "Glow Serum",
  slug: "glow-serum",
  description: "A complete description",
  short_description: "Daily glow",
  status: "draft",
  meta_title: null,
  meta_description: null,
  new_price: "24.50",
  old_price: "30.00",
  brand: null,
  subcategory: { ...category, id: 11, parent_id: 10, name: "Serums" },
  variants: [
    {
      id: 30,
      product_id: 25,
      sku: "SERUM-001",
      barcode: null,
      title: "Default",
      price: "24.50",
      compare_at_price: "30.00",
      cost_price: null,
      is_default: true,
      is_active: true,
      attribute_values: [],
      created_at: "2026-11-08T00:00:00.000000Z",
      updated_at: "2026-11-08T00:00:00.000000Z",
    },
  ],
  images: [],
  deleted_at: null,
  created_at: "2026-11-08T00:00:00.000000Z",
  updated_at: "2026-11-08T00:00:00.000000Z",
};

describe("catalog API contracts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.cookie = "XSRF-TOKEN=; Max-Age=0; Path=/";
  });

  it("uses server pagination and category filters", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ data: [category], meta }));

    const response = await listCategories("categories", {
      page: 2,
      perPage: 6,
      search: "skin care",
      status: "active",
    });

    expect(response.data[0]?.name).toBe("Skin Care");
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:8000/api/v1/admin/categories?page=2&per_page=6&search=skin+care&status=active",
    );
  });

  it("normalizes decimal product values returned by Laravel", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ data: [product], meta }),
    );

    const response = await listProducts({ perPage: 20 });
    expect(response.data[0]?.new_price).toBe(24.5);
    expect(response.data[0]?.variants?.[0]?.price).toBe(24.5);
  });

  it("loads consolidated catalog summary and form options", async () => {
    const brand = {
      id: 4,
      name: "Glow Lab",
      slug: "glow-lab",
      description: null,
      status: "active",
      deleted_at: null,
      created_at: "2026-11-08T00:00:00.000000Z",
      updated_at: "2026-11-08T00:00:00.000000Z",
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            products: { total: 12, active: 8, draft: 3, inactive: 1 },
            categories: { total: 4, active: 3, inactive: 1 },
            subcategories: { total: 9, active: 7, inactive: 2 },
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            categories: [category],
            subcategories: [
              { ...category, id: 11, parent_id: 10, name: "Serums" },
            ],
            brands: [brand],
          },
        }),
      );

    await expect(getCatalogSummary()).resolves.toMatchObject({
      products: { total: 12, active: 8 },
    });
    await expect(getCatalogOptions()).resolves.toMatchObject({
      categories: [{ id: 10 }],
      brands: [{ id: 4 }],
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "http://localhost:8000/api/v1/admin/catalog/summary",
      "http://localhost:8000/api/v1/admin/catalog/options",
    ]);
  });

  it("creates products as drafts with one default variant", async () => {
    document.cookie = "XSRF-TOKEN=catalog-token; Path=/";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ data: product }, 201));

    await createProduct({
      category_id: 10,
      subcategory_id: 11,
      brand_id: null,
      name: "Glow Serum",
      slug: "glow-serum",
      description: "A complete description",
      short_description: "Daily glow",
      status: "active",
      sku: "SERUM-001",
      price: 24.5,
      compare_at_price: 30,
    });

    const request = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body)) as Record<string, unknown>;
    expect(body.status).toBe("draft");
    expect(body.variants).toEqual([
      expect.objectContaining({ sku: "SERUM-001", is_default: true }),
    ]);
  });

  it("rejects malformed catalog responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ data: [{ id: "wrong" }], meta }),
    );

    await expect(listCategories("categories")).rejects.toBeInstanceOf(
      ApiContractError,
    );
  });
});
