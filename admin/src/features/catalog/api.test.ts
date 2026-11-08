import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createCategory,
  createProduct,
  getCatalogOptions,
  getCatalogSummary,
  listCategories,
  listProducts,
  updateProductImage,
  uploadProductImage,
} from "./api";
import {
  productImageResponseSchema,
  productResponseSchema,
} from "./contracts";
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

  it("tests actual product and image schemas", () => {
    const rawImage = {
      id: 4,
      product_id: 7,
      product_variant_id: null,
      url: "https://res.cloudinary.com/domlmlyog/image/upload/v1794117522/beauty-commerce/local/products/7/e13cd78a-8bee-4c65-8ef5-0425b72c1cb2.png",
      format: "png",
      bytes: 1862342,
      width: 1254,
      height: 1254,
      alt_text: "Deep Hydration loson - 3",
      sort_order: 2,
      is_primary: false,
      created_at: "2026-11-08T05:58:42.000000Z",
    };
    const imgParsed = productImageResponseSchema.safeParse({ data: rawImage });
    if (!imgParsed.success) {
      console.error("IMAGE ERROR:", JSON.stringify(imgParsed.error.issues, null, 2));
    }
    expect(imgParsed.success).toBe(true);

    const rawProduct = {
      id: 7,
      vendor_id: 1,
      brand_id: 2,
      primary_category_id: 3,
      name: "Deep Hydration loson",
      slug: "deep-hydration-loson",
      description: "This is the best product in world wide",
      short_description: "This is the best product in world wide",
      status: "active",
      meta_title: null,
      meta_description: null,
      new_price: "1200.00",
      old_price: "1400.00",
      brand: {
        id: 2,
        name: "Botanica Lab",
        slug: "botanica-lab",
        status: "active",
        deleted_at: null,
        created_at: "2026-11-07T04:06:11.000000Z",
        updated_at: "2026-11-07T04:06:11.000000Z",
      },
      subcategory: {
        id: 3,
        parent_id: 1,
        name: "Lipstick",
        slug: "lipstick",
        description: null,
        status: "active",
        sort_order: 10,
        parent: {
          id: 1,
          parent_id: null,
          name: "Makeup",
          slug: "makeup",
          description: null,
          status: "active",
          sort_order: 10,
          deleted_at: null,
          created_at: "2026-11-07T04:06:10.000000Z",
          updated_at: "2026-11-07T04:06:10.000000Z",
        },
        deleted_at: null,
        created_at: "2026-11-07T04:06:11.000000Z",
        updated_at: "2026-11-07T04:06:11.000000Z",
      },
      variants: [
        {
          id: 7,
          product_id: 7,
          sku: "Cream-1234",
          barcode: null,
          title: "Default",
          price: "1200.00",
          compare_at_price: "1400.00",
          cost_price: null,
          is_default: true,
          is_active: true,
          attribute_values: [],
          created_at: "2026-11-07T19:48:10.000000Z",
          updated_at: "2026-11-07T19:48:10.000000Z",
        },
      ],
      images: [rawImage],
      deleted_at: null,
      created_at: "2026-11-07T19:48:10.000000Z",
      updated_at: "2026-11-08T05:35:11.000000Z",
    };
    const prodParsed = productResponseSchema.safeParse({ data: rawProduct });
    if (!prodParsed.success) {
      console.error("PRODUCT ERROR:", JSON.stringify(prodParsed.error.issues, null, 2));
    }
    expect(prodParsed.success).toBe(true);
  });

  it("uploads product image with multipart form data", async () => {
    document.cookie = "XSRF-TOKEN=catalog-token; Path=/";
    const rawImage = {
      id: 1,
      product_id: 10,
      product_variant_id: null,
      url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      format: "jpg",
      bytes: 54321,
      width: 800,
      height: 600,
      alt_text: "Sample",
      sort_order: 0,
      is_primary: true,
      created_at: "2026-11-08T00:00:00.000000Z",
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ data: rawImage }, 201));

    const file = new File(["dummy content"], "sample.jpg", {
      type: "image/jpeg",
    });
    const result = await uploadProductImage(10, file, "Sample", true, 0);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(1);
    expect(result.is_primary).toBe(true);
  });

  it("updates product image metadata including primary flag", async () => {
    document.cookie = "XSRF-TOKEN=catalog-token; Path=/";
    const rawImage = {
      id: 2,
      product_id: 10,
      product_variant_id: null,
      url: "https://res.cloudinary.com/demo/image/upload/sample2.jpg",
      format: "jpg",
      bytes: 65432,
      width: 800,
      height: 600,
      alt_text: "Sample 2",
      sort_order: 1,
      is_primary: true,
      created_at: "2026-11-08T00:00:00.000000Z",
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ data: rawImage }));

    const result = await updateProductImage(10, 2, { is_primary: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(2);
    expect(result.is_primary).toBe(true);
  });

  it("creates root categories and subcategories safely handling null/missing sort_order", async () => {
    document.cookie = "XSRF-TOKEN=catalog-token; Path=/";
    const rawCategory = {
      id: 7,
      parent_id: null,
      name: "Eye Makeup",
      slug: "eye-makeup",
      description: "Eye makeup collection",
      status: "active",
      sort_order: null, // previously caused crash
      children_count: 0,
      deleted_at: null,
      created_at: "2026-11-08T00:00:00.000000Z",
      updated_at: "2026-11-08T00:00:00.000000Z",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ data: rawCategory }, 201),
    );

    const categoryResult = await createCategory("categories", {
      name: "Eye Makeup",
      slug: "eye-makeup",
      description: "Eye makeup collection",
      status: "active",
    });
    expect(categoryResult.id).toBe(7);
    expect(categoryResult.sort_order).toBe(0);

    const rawSubcategory = {
      id: 8,
      parent_id: 7,
      name: "Eyeliner",
      slug: "eyeliner",
      description: null,
      status: "active",
      sort_order: 0,
      products_count: 0,
      parent: rawCategory,
      deleted_at: null,
      created_at: "2026-11-08T00:00:00.000000Z",
      updated_at: "2026-11-08T00:00:00.000000Z",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ data: rawSubcategory }, 201),
    );

    const subcategoryResult = await createCategory("subcategories", {
      name: "Eyeliner",
      slug: "eyeliner",
      description: null,
      status: "active",
      category_id: 7,
    });
    expect(subcategoryResult.id).toBe(8);
    expect(subcategoryResult.parent?.name).toBe("Eye Makeup");
  });
});
