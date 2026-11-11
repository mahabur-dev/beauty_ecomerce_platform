"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export {
  ActionButton,
  ConfirmDelete,
  DismissibleNotice,
  Field,
  IconAction,
  ListToolbar,
  Modal,
  PageHeading,
  Pagination,
  Panel,
  SelectDropdown,
  StatCard,
  StatusBadge,
  TableEmpty,
  TableScroll,
  type DismissibleNoticeProps,
  type SelectOption,
} from "@/components/ui/admin-primitives";

export function DemoNote() {
  return null;
}

export function CatalogTabs({
  active,
}: {
  active: "products" | "categories" | "subcategories";
}) {
  return (
    <nav className="catalog-tabs" aria-label="Catalog sections">
      {(["products", "categories", "subcategories"] as const).map((item) => (
        <Link
          prefetch
          key={item}
          href={`/dashboard/${item}`}
          aria-current={active === item ? "page" : undefined}
          className={
            active === item ? "catalog-tab catalog-tab-active" : "catalog-tab"
          }
        >
          {item.charAt(0).toUpperCase() + item.slice(1)}
        </Link>
      ))}
    </nav>
  );
}

export function useCatalogList<T>(
  items: T[],
  matcher: (item: T, search: string, status: string) => boolean,
  size = 5,
) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const matching = useMemo(
    () =>
      items.filter((item) =>
        matcher(item, search.toLowerCase().trim(), status),
      ),
    [items, matcher, search, status],
  );
  const safePage = Math.min(
    page,
    Math.max(1, Math.ceil(matching.length / size)),
  );
  return {
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    status,
    setStatus: (value: string) => {
      setStatus(value);
      setPage(1);
    },
    page: safePage,
    setPage,
    matching,
    paged: matching.slice((safePage - 1) * size, safePage * size),
  };
}

export function CategoryAvatar({
  imageUrl,
  alt = "",
  variant = "small",
}: {
  imageUrl?: string | null | undefined;
  alt?: string | undefined;
  variant?: "small" | "large";
}) {
  return (
    <span
      className={`catalog-product-avatar catalog-product-avatar-${variant}`}
      aria-hidden={imageUrl ? undefined : true}
    >
      {imageUrl ? (
        <Image unoptimized width={44} height={44} src={imageUrl} alt={alt} />
      ) : (
        <Icon name="layers" size={variant === "large" ? 22 : 18} />
      )}
    </span>
  );
}
