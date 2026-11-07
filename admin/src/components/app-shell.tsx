"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useAdmin } from "@/features/auth/use-admin";
import { hasPermission, type Permission } from "@/features/auth/permissions";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { Icon, type IconName } from "@/components/ui/icon";

interface NavItem {
  label: string;
  href?: string;
  icon: IconName;
  permission?: Permission;
  comingSoon?: boolean;
}
interface NavGroup {
  label?: string;
  items: NavItem[];
}

// A single navigation registry is shared across desktop and mobile. Entries without routes
// are clearly marked as planned; there are no fabricated interactive destinations.
const navigation: NavGroup[] = [
  { items: [{ label: "Dashboard", href: "/dashboard", icon: "dashboard" }] },
  {
    label: "CATALOG",
    items: [
      {
        label: "Products",
        href: "/dashboard/products",
        icon: "package",
        permission: "catalog.products.read",
      },
      {
        label: "Categories",
        href: "/dashboard/categories",
        icon: "layers",
        permission: "catalog.categories.read",
      },
      {
        label: "Brands",
        href: "/dashboard/brands",
        icon: "tag",
        permission: "catalog.global-data.write",
      },
      {
        label: "Subcategories",
        href: "/dashboard/subcategories",
        icon: "layers",
        permission: "catalog.categories.read",
      },
      { label: "Inventory", icon: "store", comingSoon: true },
    ],
  },
  {
    label: "SALES & CUSTOMERS",
    items: [
      { label: "Orders", icon: "cart", comingSoon: true },
      { label: "Customers", icon: "users", comingSoon: true },
      { label: "Promotions", icon: "heart", comingSoon: true },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Analytics & reports", icon: "chart", comingSoon: true },
      { label: "Content", icon: "file", comingSoon: true },
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      {
        label: "Staff & roles",
        href: "/dashboard/staff",
        icon: "users",
        permission: "identity.staff.manage",
      },
      {
        label: "Audit logs",
        href: "/dashboard/audit-logs",
        icon: "shield",
        permission: "audit.read",
      },
      { label: "Settings", icon: "settings", comingSoon: true },
    ],
  },
];

function Brand() {
  return (
    <Link
      href="/dashboard"
      className="brand-link"
      aria-label="GlowCare Admin dashboard"
    >
      <span className="brand-mark" aria-hidden="true">
        ✿
      </span>
      <span className="brand-copy">
        <strong>GlowCare</strong>
        <small>ADMIN CONSOLE</small>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: user } = useAdmin();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const filtered = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          !item.permission || (user && hasPermission(user, item.permission)),
      ),
    }))
    .filter((group) => group.items.length);

  return (
    <div className="admin-viewport">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`admin-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}
        aria-label="Admin navigation"
      >
        <div className="sidebar-logo">
          <Brand />
          <button
            className="mobile-close"
            aria-label="Close navigation"
            type="button"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {filtered.map((group, i) => (
            <div className="nav-group" key={group.label ?? `primary-${i}`}>
              {group.label && <p className="nav-group-label">{group.label}</p>}
              {group.items.map((item) => {
                const active = Boolean(
                  item.href &&
                  (pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(`${item.href}/`))),
                );
                const content = (
                  <>
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                    {item.comingSoon && (
                      <small className="soon-marker">Soon</small>
                    )}
                    {item.href && item.href !== "/dashboard" && (
                      <Icon name="chevron" size={14} className="nav-chevron" />
                    )}
                  </>
                );
                return item.href ? (
                  <Link
                    onClick={() => setSidebarOpen(false)}
                    aria-current={active ? "page" : undefined}
                    href={item.href as Route}
                    key={item.label}
                    className={`nav-link ${active ? "nav-link-active" : ""}`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={item.label}
                    className="nav-link nav-link-planned"
                    title={`${item.label} — upcoming module`}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-footer-dot" /> GlowCare Workspace{" "}
          <small>v1 · Design preview</small>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-header">
          <div className="header-start">
            <button
              type="button"
              className="icon-button menu-button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <div className="global-search-wrap">
              <button
                type="button"
                className="global-search"
                onClick={() => setSearchOpen((s) => !s)}
                aria-expanded={searchOpen}
                aria-label="Global search availability"
              >
                <Icon name="search" size={17} />
                <span>Search products, orders, customers...</span>
                <kbd>⌘ K</kbd>
              </button>
              {searchOpen && (
                <p className="search-popover" role="status">
                  Global search will be available when the search API is
                  integrated.
                </p>
              )}
            </div>
          </div>
          <div className="header-actions">
            <span className="header-divider" />
            <span className="header-environment">Design preview</span>
            <span className="header-divider" />
            <div
              className="header-icon"
              title="Notifications will be integrated later"
            >
              <Icon name="bell" size={19} />
            </div>
            <div className="avatar" aria-hidden="true">
              {user?.name?.slice(0, 1).toUpperCase() ?? "A"}
            </div>
            <div className="header-user">
              <strong>{user?.name ?? "Administrator"}</strong>
              <small>Store administration</small>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main id="main-content" className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
