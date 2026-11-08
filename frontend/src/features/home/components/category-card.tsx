import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import type { CatalogCategory } from "@/features/catalog/types";
import type { HomeCategory } from "@/features/home/data";

const defaultCategoryImages = [
  "/images/storefront/category-skin-care.png",
  "/images/storefront/category-makeup.png",
  "/images/storefront/category-hair-care.png",
  "/images/storefront/category-body-care.png",
  "/images/storefront/category-wellness.png",
] as const;

function resolveCategoryImage(category: CatalogCategory | HomeCategory): string {
  if ("image" in category && typeof category.image === "string" && category.image.length > 0) {
    return category.image;
  }

  const slug = ("slug" in category && category.slug ? category.slug : "").toLowerCase();
  const name = category.name.toLowerCase();
  const combined = `${slug} ${name}`;

  if (combined.includes("skin") || combined.includes("cream") || combined.includes("moistur")) {
    return "/images/storefront/category-skin-care.png";
  }
  if (combined.includes("makeup") || combined.includes("eye") || combined.includes("lip")) {
    return "/images/storefront/category-makeup.png";
  }
  if (combined.includes("hair") || combined.includes("shampoo")) {
    return "/images/storefront/category-hair-care.png";
  }
  if (
    combined.includes("body") ||
    combined.includes("bath") ||
    combined.includes("lotion") ||
    combined.includes("loson")
  ) {
    return "/images/storefront/category-body-care.png";
  }
  if (combined.includes("wellness") || combined.includes("health") || combined.includes("care")) {
    return "/images/storefront/category-wellness.png";
  }

  const seed =
    "id" in category && typeof category.id === "number"
      ? category.id
      : name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return (
    defaultCategoryImages[Math.abs(seed) % defaultCategoryImages.length] ??
    defaultCategoryImages[0]
  );
}

function resolveCategoryHref(category: CatalogCategory | HomeCategory): Route {
  if ("href" in category && typeof category.href === "string") {
    return category.href as Route;
  }
  if ("slug" in category && typeof category.slug === "string") {
    return `/categories/${category.slug}` as Route;
  }
  return "/categories" as Route;
}

function resolveCategoryCount(category: CatalogCategory | HomeCategory): string {
  if ("productCount" in category && typeof category.productCount === "string") {
    return category.productCount;
  }
  if ("subcategories" in category && Array.isArray(category.subcategories)) {
    const count = category.subcategories.length;
    if (count > 0) {
      return `${count} ${count === 1 ? "subcategory" : "subcategories"}`;
    }
  }
  return "Explore collection";
}

export function CategoryCard({
  category,
}: {
  category: CatalogCategory | HomeCategory;
}) {
  const imageSrc = resolveCategoryImage(category);
  const href = resolveCategoryHref(category);
  const countLabel = resolveCategoryCount(category);

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-surface-elevated shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
    >
      <div className="relative aspect-[1.12] w-full overflow-hidden bg-brand-50">
        <Image
          src={imageSrc}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 31vw, 18vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-3 text-center sm:p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-ink transition-colors group-hover:text-brand-700 sm:text-base">
          {category.name}
        </h3>
        <p className="mt-1 text-xs font-medium text-ink-muted">{countLabel}</p>
      </div>
    </Link>
  );
}
