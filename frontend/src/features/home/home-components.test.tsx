import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CatalogCategory, CatalogProduct } from "@/features/catalog/types";
import { CategoryCard, ProductCard } from "@/features/home/components";
import type { HomeCategory, PreviewProduct } from "@/features/home/data";

describe("Home Page Components", () => {
  describe("CategoryCard", () => {
    it("renders dynamic backend category with link and subcategory count", () => {
      const mockCategory: CatalogCategory = {
        id: 7,
        parent_id: null,
        name: "Eye Makeup",
        slug: "eye-makeup",
        description: "Best eye makeup products",
        subcategories: [
          {
            id: 8,
            parent_id: 7,
            name: "Eyeliner",
            slug: "eyeliner",
            description: null,
          },
        ],
      };

      render(<CategoryCard category={mockCategory} />);

      expect(screen.getByText("Eye Makeup")).toBeInTheDocument();
      expect(screen.getByText("1 subcategory")).toBeInTheDocument();

      const link = screen.getByRole("link", { name: /eye makeup/i });
      expect(link).toHaveAttribute("href", "/categories/eye-makeup");
    });

    it("renders fallback home category correctly", () => {
      const mockHomeCategory: HomeCategory = {
        name: "Skin Care",
        productCount: "120+ Products",
        image: "/images/storefront/category-skin-care.png",
        href: "/categories/skin-care",
      };

      render(<CategoryCard category={mockHomeCategory} />);

      expect(screen.getByText("Skin Care")).toBeInTheDocument();
      expect(screen.getByText("120+ Products")).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /skin care/i });
      expect(link).toHaveAttribute("href", "/categories/skin-care");
    });
  });

  describe("ProductCard", () => {
    it("renders dynamic backend product with BDT currency and Sale badge", () => {
      const mockProduct: CatalogProduct = {
        id: 1,
        name: "Deep Hydration Cream",
        slug: "deep-hydration-cream",
        short_description: "Rich hydrating cream",
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
        subcategory: null,
        primary_image: {
          id: 10,
          variant_id: null,
          url: "https://example.com/cream.png",
          format: "png",
          width: 500,
          height: 500,
          alt_text: "Deep Hydration Cream jar",
          is_primary: true,
        },
      };

      render(<ProductCard product={mockProduct} />);

      expect(screen.getByText("Deep Hydration Cream")).toBeInTheDocument();
      expect(screen.getByText("Botanica Lab")).toBeInTheDocument();
      expect(screen.getByText("৳1,200.00")).toBeInTheDocument();
      expect(screen.getByText("৳1,400.00")).toBeInTheDocument();
      expect(screen.getByText("Sale")).toBeInTheDocument();

      const productLinks = screen.getAllByRole("link", {
        name: /deep hydration cream/i,
      });
      expect(productLinks[0]).toHaveAttribute(
        "href",
        "/products/deep-hydration-cream",
      );

      const addToCartBtn = screen.getByRole("link", { name: /add to cart/i });
      expect(addToCartBtn).toHaveAttribute(
        "href",
        "/products/deep-hydration-cream",
      );
    });

    it("renders static preview product correctly", () => {
      const mockPreviewProduct: PreviewProduct = {
        name: "Matte Lipstick",
        size: "4.2g",
        price: "৳450",
        oldPrice: "৳650",
        reviews: 212,
        image: "/images/storefront/product-matte-lipstick.png",
        href: "/products/matte-lipstick",
      };

      render(<ProductCard product={mockPreviewProduct} />);

      expect(screen.getByText("Matte Lipstick")).toBeInTheDocument();
      expect(screen.getByText("4.2g")).toBeInTheDocument();
      expect(screen.getByText("৳450")).toBeInTheDocument();
      expect(screen.getByText("৳650")).toBeInTheDocument();
      expect(screen.getByText("(212)")).toBeInTheDocument();
    });
  });
});

