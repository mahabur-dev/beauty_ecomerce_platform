import {
  ArrowRight,
  Grid3X3,
  Leaf,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRoundCheck,
} from "lucide-react";
import Image from "next/image";

import { buttonStyles, Container } from "@/components/ui";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "100% Original",
    text: "Authentic & trusted brands",
  },
  {
    icon: UserRoundCheck,
    title: "Expert Approved",
    text: "Dermatologically tested",
  },
  { icon: Truck, title: "Fast Delivery", text: "At your doorstep" },
  { icon: RefreshCcw, title: "Easy Returns", text: "Hassle-free returns" },
] as const;

export function HomeHero() {
  return (
    <section className="relative bg-[#fff7f7] pb-16 sm:pb-20">
      <div className="relative min-h-[620px] overflow-hidden sm:min-h-[570px] lg:min-h-[520px]">
        <Image
          src="/images/storefront/hero-beauty.png"
          alt="Woman enjoying a calm beauty and wellness routine"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[67%_center] sm:object-center"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#fff8f8] from-0% via-[#fff8f8]/95 via-48% to-transparent sm:via-42%" />
        <Container className="relative flex min-h-[620px] items-start pt-14 sm:min-h-[570px] sm:items-center sm:pt-0 lg:min-h-[520px]">
          <div className="max-w-[39rem] sm:w-[56%]">
            <div className="border-brand-200 text-brand-700 inline-flex items-center gap-2 rounded-full border bg-white/70 px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-sm">
              <Sparkles className="size-4 text-amber-500" aria-hidden="true" />
              Radiate Confidence Every Day
            </div>
            <h1 className="text-ink mt-7 text-[clamp(2.65rem,5.2vw,4.5rem)] leading-[1.06] font-extrabold tracking-[-0.045em] text-balance">
              Beauty &amp; Wellness
              <br />
              for a <span className="text-brand-600">Better You</span>
            </h1>
            <p className="text-ink-muted mt-6 max-w-lg text-base leading-7 sm:text-lg">
              Discover premium health &amp; beauty products
              <br className="hidden sm:block" /> for healthy skin, hair &amp;
              body.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/products" className={buttonStyles({ size: "lg" })}>
                Shop Now
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a
                href="/categories"
                className={buttonStyles({ variant: "outline", size: "lg" })}
              >
                Explore Categories
                <Grid3X3 className="text-brand-700 size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </Container>
        <div className="absolute right-[4%] bottom-16 hidden size-32 place-items-center rounded-full bg-white text-center shadow-xl lg:grid xl:right-[7%] xl:size-36">
          <div>
            <Leaf
              className="text-brand-600 mx-auto size-7 fill-current"
              aria-hidden="true"
            />
            <p className="text-ink mt-1 text-2xl font-extrabold">100%</p>
            <p className="text-ink text-[11px] font-semibold">
              Original Products
            </p>
          </div>
        </div>
      </div>

      <Container className="relative -mt-11 sm:-mt-12">
        <div className="border-brand-100 bg-surface-elevated shadow-soft grid overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map(({ icon: Icon, text, title }) => (
            <div
              key={title}
              className="border-brand-100 flex items-center gap-4 border-b p-5 last:border-0 sm:odd:border-r sm:nth-[3]:border-b-0 sm:nth-[4]:border-b-0 lg:border-r lg:border-b-0 lg:last:border-r-0"
            >
              <Icon
                className="text-brand-600 size-8 shrink-0"
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <div>
                <h2 className="text-ink text-sm font-bold">{title}</h2>
                <p className="text-ink-muted mt-1 text-xs">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
