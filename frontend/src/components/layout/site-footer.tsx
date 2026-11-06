import { CircleHelp, Mail, MapPin } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { Container } from "@/components/ui";
import { primaryNavigation, supportNavigation } from "@/config/navigation";

const currentYear = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="border-brand-100 text-ink mt-auto border-t bg-[#fff8fa]">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <BrandLogo />
          <p className="text-ink-muted mt-5 max-w-sm text-sm leading-6">
            A thoughtful destination for trusted health, beauty and
            personal-care products.
          </p>
        </div>

        <FooterNavigation title="Shop" items={primaryNavigation.slice(0, 5)} />
        <FooterNavigation title="Customer care" items={supportNavigation} />

        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase">
            Get in touch
          </h2>
          <ul className="text-ink-muted mt-5 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Support details will be available before launch</span>
            </li>
            <li className="flex items-start gap-3">
              <CircleHelp
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <a href="/faq" className="hover:text-brand-700">
                Help and frequently asked questions
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Bangladesh storefront</span>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-brand-100 border-t">
        <Container className="text-ink-muted flex flex-col gap-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} GlowCare. All rights reserved.</p>
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2"
            aria-label="Legal navigation"
          >
            <a href="/privacy" className="hover:text-brand-700">
              Privacy policy
            </a>
            <a href="/terms" className="hover:text-brand-700">
              Terms & conditions
            </a>
          </nav>
        </Container>
      </div>
    </footer>
  );
}

interface FooterNavigationProps {
  title: string;
  items: readonly { label: string; href: string }[];
}

function FooterNavigation({ items, title }: FooterNavigationProps) {
  return (
    <nav aria-label={`${title} links`}>
      <h2 className="text-sm font-bold tracking-wider uppercase">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="text-ink-muted hover:text-brand-700 text-sm transition"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
