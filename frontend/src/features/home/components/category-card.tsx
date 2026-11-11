import { FolderTree } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import type { CatalogCategory } from "@/features/catalog/types";

function resolveCategoryCount(category: CatalogCategory): string {
  if (Array.isArray(category.subcategories) && category.subcategories.length > 0) {
    const count = category.subcategories.length;
    return `${count} ${count === 1 ? "subcategory" : "subcategories"}`;
  }

  return "Explore collection";
}

/** Displays a catalog category card backed strictly by Cloudinary media or an icon placeholder. */
export function CategoryCard({ category }: { category: CatalogCategory }) {
  const imageUrl = category.image?.url ?? null;
  const href = `/categories/${category.slug}` as Route;
  const countLabel = resolveCategoryCount(category);

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-surface-elevated shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
    >
      <div className="relative aspect-[1.12] w-full overflow-hidden bg-brand-50">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={category.name}
              fill
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 31vw, 18vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </>
        ) : (
          <div className="grid size-full place-items-center text-brand-300 transition-colors group-hover:text-brand-500">
            <FolderTree className="size-10" aria-hidden="true" />
          </div>
        )}
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
