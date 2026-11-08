import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductGallery } from "./components/product-gallery";
import { ProductPurchaseBox } from "./components/product-purchase-box";
import { ProductReviews } from "./components/product-reviews";
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

describe("ProductGallery", () => {
  it("renders the primary image and thumbnail views when multiple images exist", () => {
    render(<ProductGallery images={mockImages} name={mockProduct.name} hasDiscount />);

    const mainImgs = screen.getAllByAltText("Main View");
    expect(mainImgs.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Special Sale")).toBeInTheDocument();

    const thumbnails = screen.getAllByRole("button", { name: /View product image/i });
    expect(thumbnails).toHaveLength(2);

    // Click second thumbnail
    fireEvent.click(thumbnails[1]!);
    expect(screen.getAllByAltText("Side View").length).toBeGreaterThanOrEqual(1);
  });
});

describe("ProductPurchaseBox", () => {
  it("renders product pricing and manages quantity selector increment/decrement", () => {
    render(<ProductPurchaseBox product={mockProduct} />);

    expect(screen.getByRole("heading", { level: 1, name: "Deep Hydration Lotion" })).toBeInTheDocument();
    expect(screen.getByText("৳1,200.00")).toBeInTheDocument();
    expect(screen.getByText("৳1,400.00")).toBeInTheDocument();

    const qtyInput = screen.getByLabelText("Item quantity");
    expect(qtyInput).toHaveValue(1);

    const plusBtn = screen.getByRole("button", { name: "Increase quantity" });
    const minusBtn = screen.getByRole("button", { name: "Decrease quantity" });

    // Minus at 1 should be disabled
    expect(minusBtn).toBeDisabled();

    // Increment
    fireEvent.click(plusBtn);
    expect(qtyInput).toHaveValue(2);
    expect(minusBtn).not.toBeDisabled();

    // Decrement
    fireEvent.click(minusBtn);
    expect(qtyInput).toHaveValue(1);

    // Add to cart feedback
    const addCartBtn = screen.getByRole("button", { name: /Add to Cart/i });
    fireEvent.click(addCartBtn);
    expect(screen.getByRole("status")).toHaveTextContent("Added 1 × “Deep Hydration Lotion” to your cart.");
  });

  it("toggles wishlist state on button click", () => {
    render(<ProductPurchaseBox product={mockProduct} />);

    const wishlistBtn = screen.getByRole("button", { name: "Add to wishlist" });
    expect(wishlistBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(wishlistBtn);
    expect(screen.getByRole("button", { name: "Remove from wishlist" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("ProductReviews", () => {
  it("allows submitting a new review and displays it in the list", () => {
    render(<ProductReviews productName={mockProduct.name} />);

    expect(screen.getByRole("heading", { level: 2, name: /Customer Reviews & Ratings/i })).toBeInTheDocument();

    // Open write review form
    const writeBtn = screen.getByRole("button", { name: "Write a Review" });
    fireEvent.click(writeBtn);

    const nameInput = screen.getByLabelText(/Your Name \*/i);
    const titleInput = screen.getByLabelText(/Review Headline/i);
    const commentInput = screen.getByLabelText(/Review details \*/i);

    fireEvent.change(nameInput, { target: { value: "Mahabur Tester" } });
    fireEvent.change(titleInput, { target: { value: "Outstanding hydration!" } });
    fireEvent.change(commentInput, { target: { value: "Truly works miracles on dry skin, very impressed." } });

    // Submit review
    const submitBtn = screen.getByRole("button", { name: "Submit Review" });
    fireEvent.click(submitBtn);

    expect(screen.getByRole("status")).toHaveTextContent("Thank you! Your review has been submitted successfully.");
    expect(screen.getByText("Mahabur Tester")).toBeInTheDocument();
    expect(screen.getByText("Outstanding hydration!")).toBeInTheDocument();
  });
});
