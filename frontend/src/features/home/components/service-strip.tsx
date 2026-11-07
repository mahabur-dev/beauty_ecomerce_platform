import { BadgePercent, CreditCard, Gift, Headphones } from "lucide-react";

const services = [
  { icon: CreditCard, title: "Secure Payments", text: "100% safe & secure" },
  {
    icon: BadgePercent,
    title: "Exclusive Offers",
    text: "Save more on top brands",
  },
  { icon: Headphones, title: "24/7 Support", text: "We're here to help" },
  { icon: Gift, title: "Loyalty Rewards", text: "Earn points & get rewards" },
] as const;

export function ServiceStrip() {
  return (
    <section className="border-brand-100 bg-brand-50 grid overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-4">
      {services.map(({ icon: Icon, text, title }) => (
        <div
          key={title}
          className="border-brand-100 flex items-center gap-3 border-b p-5 last:border-0 sm:odd:border-r lg:border-r lg:border-b-0 lg:last:border-r-0"
        >
          <Icon
            className="text-brand-600 size-7 shrink-0"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <div>
            <h2 className="text-ink text-sm font-bold">{title}</h2>
            <p className="text-ink-muted mt-0.5 text-xs">{text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
