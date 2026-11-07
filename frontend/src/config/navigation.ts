export interface NavigationItem {
  label: string;
  href: string;
}

export const primaryNavigation: readonly NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "Brands", href: "/brands" },
  { label: "Offers", href: "/offers" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
];

export const customerNavigation: readonly NavigationItem[] = [
  { label: "My account", href: "/account" },
  { label: "My orders", href: "/account/orders" },
  { label: "Wishlist", href: "/wishlist" },
];

export const supportNavigation: readonly NavigationItem[] = [
  { label: "Contact us", href: "/contact" },
  { label: "Shipping & returns", href: "/shipping-returns" },
  { label: "Frequently asked questions", href: "/faq" },
];
