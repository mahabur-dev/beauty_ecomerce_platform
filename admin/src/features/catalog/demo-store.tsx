"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CatalogStatus = "Active" | "Draft" | "Archived";
export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string;
  status: CatalogStatus;
  image: string;
  productCount: number;
};
export type Product = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  subcategoryId: string;
  price: number;
  oldPrice: number;
  stock: number;
  status: CatalogStatus;
  image: string;
  description: string;
  featured: boolean;
};

export const categorySeeds: Category[] = [
  {
    id: "cat-1",
    name: "Skin Care",
    slug: "skin-care",
    parentId: null,
    description: "Everyday essentials for luminous skin",
    status: "Active",
    image: "🧴",
    productCount: 124,
  },
  {
    id: "cat-2",
    name: "Makeup",
    slug: "makeup",
    parentId: null,
    description: "Beauty essentials and color cosmetics",
    status: "Active",
    image: "💄",
    productCount: 148,
  },
  {
    id: "cat-3",
    name: "Hair Care",
    slug: "hair-care",
    parentId: null,
    description: "Healthy hair from root to tip",
    status: "Active",
    image: "🌸",
    productCount: 96,
  },
  {
    id: "cat-4",
    name: "Body Care",
    slug: "body-care",
    parentId: null,
    description: "Body wash, lotions and treatments",
    status: "Active",
    image: "🫧",
    productCount: 82,
  },
  {
    id: "cat-5",
    name: "Health & Wellness",
    slug: "health-wellness",
    parentId: null,
    description: "Wellness from the inside out",
    status: "Active",
    image: "🌿",
    productCount: 91,
  },
  {
    id: "sub-1",
    name: "Serums & Treatments",
    slug: "serums-treatments",
    parentId: "cat-1",
    description: "Targeted skin treatments",
    status: "Active",
    image: "✨",
    productCount: 38,
  },
  {
    id: "sub-2",
    name: "Moisturizers",
    slug: "moisturizers",
    parentId: "cat-1",
    description: "Hydrate and nourish",
    status: "Active",
    image: "🧴",
    productCount: 42,
  },
  {
    id: "sub-3",
    name: "Cleansers",
    slug: "cleansers",
    parentId: "cat-1",
    description: "Gentle everyday cleansing",
    status: "Active",
    image: "💧",
    productCount: 44,
  },
  {
    id: "sub-4",
    name: "Lipsticks",
    slug: "lipsticks",
    parentId: "cat-2",
    description: "Matte, satin and glossy colors",
    status: "Active",
    image: "💄",
    productCount: 56,
  },
  {
    id: "sub-5",
    name: "Face Makeup",
    slug: "face-makeup",
    parentId: "cat-2",
    description: "Foundation and complexion",
    status: "Active",
    image: "🎨",
    productCount: 92,
  },
  {
    id: "sub-6",
    name: "Shampoo",
    slug: "shampoo",
    parentId: "cat-3",
    description: "Cleanse and restore",
    status: "Active",
    image: "🧴",
    productCount: 41,
  },
  {
    id: "sub-7",
    name: "Body Lotions",
    slug: "body-lotions",
    parentId: "cat-4",
    description: "Silky hydration",
    status: "Draft",
    image: "🫧",
    productCount: 27,
  },
];

export const productSeeds: Product[] = [
  {
    id: "PRD-02011",
    name: "Vitamin C Brightening Serum",
    sku: "GC-SRM-001",
    categoryId: "cat-1",
    subcategoryId: "sub-1",
    price: 24.99,
    oldPrice: 34.99,
    stock: 128,
    status: "Active",
    image: "🍊",
    description: "Radiance-boosting vitamin C serum for daily skincare.",
    featured: true,
  },
  {
    id: "PRD-02026",
    name: "Hydrating Face Cream",
    sku: "GC-CRM-002",
    categoryId: "cat-1",
    subcategoryId: "sub-2",
    price: 19.99,
    oldPrice: 29.99,
    stock: 64,
    status: "Active",
    image: "🧴",
    description: "Rich but lightweight hydration for all skin types.",
    featured: true,
  },
  {
    id: "PRD-02008",
    name: "Keratin Repair Shampoo",
    sku: "GC-SHP-003",
    categoryId: "cat-3",
    subcategoryId: "sub-6",
    price: 15.99,
    oldPrice: 23.99,
    stock: 210,
    status: "Active",
    image: "🌷",
    description: "Daily keratin care for soft, healthy-looking hair.",
    featured: false,
  },
  {
    id: "PRD-02012",
    name: "Velvet Matte Lipstick",
    sku: "GC-LIP-004",
    categoryId: "cat-2",
    subcategoryId: "sub-4",
    price: 9.99,
    oldPrice: 14.99,
    stock: 14,
    status: "Active",
    image: "💄",
    description: "High-pigment velvet matte finish.",
    featured: true,
  },
  {
    id: "PRD-02042",
    name: "Rosewater Glow Cleanser",
    sku: "GC-CLN-005",
    categoryId: "cat-1",
    subcategoryId: "sub-3",
    price: 18.5,
    oldPrice: 22.0,
    stock: 0,
    status: "Draft",
    image: "🌹",
    description: "Gentle rosewater cleanser.",
    featured: false,
  },
  {
    id: "PRD-02051",
    name: "Dewy Skin Foundation",
    sku: "GC-FND-006",
    categoryId: "cat-2",
    subcategoryId: "sub-5",
    price: 32,
    oldPrice: 39,
    stock: 33,
    status: "Active",
    image: "🎨",
    description: "Buildable coverage with a luminous finish.",
    featured: false,
  },
  {
    id: "PRD-02063",
    name: "Nourishing Body Lotion",
    sku: "GC-BDY-007",
    categoryId: "cat-4",
    subcategoryId: "sub-7",
    price: 17.5,
    oldPrice: 22.5,
    stock: 86,
    status: "Draft",
    image: "🫧",
    description: "Comforting hydration for every day.",
    featured: false,
  },
];

type Store = {
  categories: Category[];
  products: Product[];
  upsertCategory: (record: Category) => void;
  removeCategory: (id: string) => boolean;
  upsertProduct: (record: Product) => void;
  removeProduct: (id: string) => void;
};
const CatalogContext = createContext<Store | null>(null);

/** Demo-only state. Resides above route segments so switching tabs does not reset UI edits. */
export function CatalogDemoProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(categorySeeds);
  const [products, setProducts] = useState<Product[]>(productSeeds);
  const value = useMemo<Store>(
    () => ({
      categories,
      products,
      upsertCategory: (record) =>
        setCategories((items) =>
          items.some((item) => item.id === record.id)
            ? items.map((item) => (item.id === record.id ? record : item))
            : [record, ...items],
        ),
      removeCategory: (id) => {
        if (
          categories.some((item) => item.parentId === id) ||
          products.some(
            (item) => item.categoryId === id || item.subcategoryId === id,
          )
        )
          return false;
        setCategories((items) => items.filter((item) => item.id !== id));
        return true;
      },
      upsertProduct: (record) =>
        setProducts((items) =>
          items.some((item) => item.id === record.id)
            ? items.map((item) => (item.id === record.id ? record : item))
            : [record, ...items],
        ),
      removeProduct: (id) =>
        setProducts((items) => items.filter((item) => item.id !== id)),
    }),
    [categories, products],
  );
  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}
export function useCatalogDemo() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("CatalogDemoProvider is missing");
  return context;
}
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
