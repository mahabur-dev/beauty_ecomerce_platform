import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authApi from "@/features/auth/api";
import * as reviewsApi from "@/features/reviews/api";

import { ProductGallery } from "./components/product-gallery";
import { ProductPurchaseBox } from "./components/product-purchase-box";
import type { CatalogImage, CatalogProductDetail } from "./types";

const mockImages: CatalogImage[] = [
  {
    id: 1,
    variant_id: null,
    url: "https://example.com/image-1.png",
    format: "png",
    width: 600,
    height: 600,
    alt_text: "Main View",
    is_primary: true,
  },
  {
    id: 2,
    variant_id: null,
    url: "https://example.com/image-2.png",
    format: "png",
    width: 600,
    height: 600,
    alt_text: "Side View",
    is_primary: false,
  },
];

const mockProduct: CatalogProductDetail = {
  id: 7,
  name: "Deep Hydration Lotion",
  slug: "deep-hydration-lotion",
  short_description: "Top rated gentle lotion for daily glow.",
  description: "Full deep hydration formula enriched with hyaluronic acid.",
  new_price: "1200.00",
  old_price: "1400.00",
  brand: {
    name: "Botanica Lab",
    slug: "botanica-lab",
  },
  category: {
    name: "Skincare",
    slug: "skincare",
  },
  subcategory: {
    name: "Moisturizers",
    slug: "moisturizers",
  },
  primary_image: mockImages[0] ?? null,
  images: mockImages,
  variants: [
    {
      id: 7,
      sku: "DHL-001",
      title: "Default",
      price: "1200.00",
      compare_at_price: "1400.00",
      is_default: true,
    },
  ],
  meta_title: null,
  meta_description: null,
};

function renderWithQueryClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("ProductGallery", () => {
  it("renders the primary image and thumbnail views when multiple images exist", () => {
    render(
      <ProductGallery
        images={mockImages}
        name={mockProduct.name}
        hasDiscount
      />,
    );

    const mainImgs = screen.getAllByAltText("Main View");
    expect(mainImgs.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Special Sale")).toBeInTheDocument();

    const thumbnails = screen.getAllByRole("button", {
      name: /View product image/i,
    });
    expect(thumbnails).toHaveLength(2);

    fireEvent.click(thumbnails[1]!);
    expect(screen.getAllByAltText("Side View").length).toBeGreaterThanOrEqual(
      1,
    );
  });
});

describe("ProductPurchaseBox", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(null);
    vi.spyOn(reviewsApi, "getProductReviewSummary").mockResolvedValue({
      average_rating: 4.5,
      total_reviews: 12,
      distribution: { "5": 8, "4": 2, "3": 2, "2": 0, "1": 0 },
    });
  });

  it("renders product pricing, live rating summary, and manages quantity selector", async () => {
    renderWithQueryClient(<ProductPurchaseBox product={mockProduct} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Deep Hydration Lotion" }),
    ).toBeInTheDocument();
    expect(screen.getByText("৳1,200.00")).toBeInTheDocument();
    expect(screen.getByText("৳1,400.00")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("4.5")).toBeInTheDocument();
      expect(screen.getByText("12 customer reviews")).toBeInTheDocument();
    });

    const qtyInput = screen.getByLabelText("Item quantity");
    expect(qtyInput).toHaveValue(1);

    const plusBtn = screen.getByRole("button", { name: "Increase quantity" });
    const minusBtn = screen.getByRole("button", { name: "Decrease quantity" });

    expect(minusBtn).toBeDisabled();

    fireEvent.click(plusBtn);
    expect(qtyInput).toHaveValue(2);
    expect(minusBtn).not.toBeDisabled();

    fireEvent.click(minusBtn);
    expect(qtyInput).toHaveValue(1);

    const addCartBtn = screen.getByRole("button", { name: /Add to Cart/i });
    fireEvent.click(addCartBtn);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Added 1 × “Deep Hydration Lotion” to your cart.",
    );
  });

  it("toggles wishlist state on button click", () => {
    renderWithQueryClient(<ProductPurchaseBox product={mockProduct} />);

    const wishlistBtn = screen.getByRole("button", {
      name: "Add to wishlist",
    });
    expect(wishlistBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(wishlistBtn);
    expect(
      screen.getByRole("button", { name: "Remove from wishlist" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
