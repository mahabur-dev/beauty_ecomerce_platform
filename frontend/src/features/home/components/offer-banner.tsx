import { ArrowRight, Flame } from "lucide-react";
import Image from "next/image";

export function OfferBanner() {
  return (
    <section className="bg-brand-600 relative min-h-60 overflow-hidden rounded-2xl text-white shadow-lg sm:min-h-64">
      <Image
        src="/images/storefront/offer-banner.png"
        alt="Pink skincare collection with roses"
        fill
        sizes="(max-width: 1280px) 100vw, 1280px"
        className="object-cover object-center"
      />
      <div className="via-brand-600/5 to-brand-800/15 absolute inset-0 bg-linear-to-r from-transparent" />
      <div className="relative ml-auto flex min-h-60 w-full flex-col justify-center px-7 py-8 sm:min-h-64 sm:w-[58%] sm:px-10 lg:w-[56%]">
        <p className="flex items-center gap-2 text-sm font-semibold text-white/90">
          <Flame
            className="size-4 fill-amber-300 text-amber-300"
            aria-hidden="true"
          />
          Limited Time Offer
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Up to 30% OFF
        </h2>
        <p className="mt-2 text-sm text-white/85 sm:text-base">
          On Top Beauty &amp; Wellness Brands
        </p>
        <a
          href="/offers"
          className="text-brand-700 hover:bg-brand-50 mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold shadow-sm transition"
        >
          Shop the Sale
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
