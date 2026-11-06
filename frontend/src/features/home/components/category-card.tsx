import Image from "next/image";

import type { HomeCategory } from "@/features/home/data";

export function CategoryCard({ category }: { category: HomeCategory }) {
  return (
    <a
      href={category.href}
      className="border-brand-100 bg-surface-elevated shadow-soft group overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="bg-brand-50 relative aspect-[1.12] overflow-hidden">
        <Image
          src={category.image}
          alt=""
          fill
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 31vw, 18vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="px-3 py-4 text-center">
        <h3 className="text-ink text-sm font-bold sm:text-base">
          {category.name}
        </h3>
        <p className="text-ink-muted mt-1 text-xs">{category.productCount}</p>
      </div>
    </a>
  );
}
