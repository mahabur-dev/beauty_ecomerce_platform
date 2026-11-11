import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CatalogCategory, CatalogProduct } from "@/features/catalog/types";
import {
  CategoryCard,
  CategoryCarousel,
  ProductCard,
  SectionHeading,
} from "@/features/home/components";
import type { PreviewProduct } from "@/features/home/data";

describe("Home Page Components", () => {
  describe("CategoryCard", () => {
    it("renders dynamic backend category image when Cloudinary asset exists", () => {
      const mockCategory: CatalogCategory = {
        id: 7,
        parent_id: null,
        name: "Eye Makeup",
        slug: "eye-makeup",
        description: "Best eye makeup products",
        image: {
          url: "https://res.cloudinary.com/demo/image/upload/categories/7/eye-makeup.jpg",
          format: "jpg",
          width: 800,
          height: 800,
        },
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

      const image = screen.getByRole("img", { name: "Eye Makeup" });
      expect(image).toHaveAttribute(
        "src",
        expect.stringContaining("res.cloudinary.com"),
      );

      const link = screen.getByRole("link", { name: /eye makeup/i });
      expect(link).toHaveAttribute("href", "/categories/eye-makeup");
    });

    it("renders clean icon placeholder instead of hardcoded images when category has no uploaded image", () => {
      const mockCategory: CatalogCategory = {
        id: 9,
        parent_id: null,
        name: "Skin Care",
        slug: "skin-care",
        description: null,
        image: null,
        subcategories: [],
      };

      const { container } = render(<CategoryCard category={mockCategory} />);

      expect(screen.getByText("Skin Care")).toBeInTheDocument();
      expect(screen.getByText("Explore collection")).toBeInTheDocument();
      expect(container.querySelector("img")).toBeNull();
      const link = screen.getByRole("link", { name: /skin care/i });
      expect(link).toHaveAttribute("href", "/categories/skin-care");
    });
  });

  describe("CategoryCarousel & SectionHeading overflow behavior", () => {
    function buildCategories(count: number): CatalogCategory[] {
      return Array.from({ length: count }, (_, idx) => ({
        id: idx + 1,
        parent_id: null,
        name: `Category ${idx + 1}`,
        slug: `category-${idx + 1}`,
        description: null,
        image: null,
        subcategories: [],
      }));
    }

    it("hides shift arrows and View All Categories when 5 or fewer categories exist", () => {
      render(
        <>
          <SectionHeading title="Shop by Category" />
          <CategoryCarousel categories={buildCategories(5)} />
        </>,
      );

      expect(
        screen.queryByRole("button", { name: "Previous categories" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Next categories" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /View All Categories/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Category 5")).toBeInTheDocument();
    });

    it("renders left/right shift buttons and slides smoothly across 7 categories", () => {
      render(
        <>
          <SectionHeading
            title="Shop by Category"
            actionLabel="View All Categories"
            actionHref="/categories"
          />
          <CategoryCarousel categories={buildCategories(7)} />
        </>,
      );

      expect(
        screen.getByRole("link", { name: /View All Categories/i }),
      ).toHaveAttribute("href", "/categories");

      const prevBtn = screen.getByRole("button", {
        name: "Previous categories",
      });
      const nextBtn = screen.getByRole("button", { name: "Next categories" });
      const track = screen.getByTestId("category-carousel-track");

      expect(prevBtn).toBeDisabled();
      expect(nextBtn).toBeEnabled();
      expect(track.style.transform).toBe("translateX(-0%)");

      fireEvent.click(nextBtn);
      expect(prevBtn).toBeEnabled();
      expect(nextBtn).toBeEnabled();
      expect(track.style.transform).toBe("translateX(-20%)");

      fireEvent.click(nextBtn);
      expect(track.style.transform).toBe("translateX(-40%)");
      expect(nextBtn).toBeDisabled();

      fireEvent.click(prevBtn);
      expect(track.style.transform).toBe("translateX(-20%)");
      expect(nextBtn).toBeEnabled();
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

