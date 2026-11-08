export interface HomeCategory {
  name: string;
  productCount: string;
  image: string;
  href: string;
}

export interface PreviewProduct {
  name: string;
  size: string;
  price: string;
  oldPrice: string;
  reviews: number;
  image: string;
  href: string;
}

export const homeCategories: readonly HomeCategory[] = [
  {
    name: "Skin Care",
    productCount: "120+ Products",
    image: "/images/storefront/category-skin-care.png",
    href: "/categories/skin-care",
  },
  {
    name: "Hair Care",
    productCount: "95+ Products",
    image: "/images/storefront/category-hair-care.png",
    href: "/categories/hair-care",
  },
  {
    name: "Body Care",
    productCount: "80+ Products",
    image: "/images/storefront/category-body-care.png",
    href: "/categories/body-care",
  },
  {
    name: "Makeup",
    productCount: "150+ Products",
    image: "/images/storefront/category-makeup.png",
    href: "/categories/makeup",
  },
  {
    name: "Health & Wellness",
    productCount: "90+ Products",
    image: "/images/storefront/category-wellness.png",
    href: "/categories/health-wellness",
  },
];

export const previewProducts: readonly PreviewProduct[] = [
  {
    name: "Vitamin C Face Serum",
    size: "30ml",
    price: "৳1,250",
    oldPrice: "৳1,650",
    reviews: 265,
    image: "/images/storefront/product-vitamin-c-serum.png",
    href: "/products/vitamin-c-face-serum",
  },
  {
    name: "Hydrating Face Cream",
    size: "50g",
    price: "৳950",
    oldPrice: "৳1,350",
    reviews: 198,
    image: "/images/storefront/product-hydrating-cream.png",
    href: "/products/hydrating-face-cream",
  },
  {
    name: "Keratin Shampoo",
    size: "200ml",
    price: "৳750",
    oldPrice: "৳1,100",
    reviews: 310,
    image: "/images/storefront/product-keratin-shampoo.png",
    href: "/products/keratin-shampoo",
  },
  {
    name: "Aloe Vera Gel",
    size: "150ml",
    price: "৳550",
    oldPrice: "৳750",
    reviews: 154,
    image: "/images/storefront/product-aloe-vera-gel.png",
    href: "/products/aloe-vera-gel",
  },
  {
    name: "Matte Lipstick",
    size: "4.2g",
    price: "৳450",
    oldPrice: "৳650",
    reviews: 212,
    image: "/images/storefront/product-matte-lipstick.png",
    href: "/products/matte-lipstick",
  },
];
