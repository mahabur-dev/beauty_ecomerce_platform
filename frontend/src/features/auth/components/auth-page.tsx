import { ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Container } from "@/components/ui";

export function AuthPage({ children }: { children: ReactNode }) {
  return (
    <section className="from-brand-50 via-surface-page relative isolate overflow-hidden bg-gradient-to-br to-white py-12 sm:py-16 lg:py-20">
      <div
        className="bg-brand-200/45 absolute -top-28 -right-28 -z-10 size-80 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="bg-brand-100/70 absolute -bottom-24 -left-20 -z-10 size-72 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <Container className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,34rem)] lg:gap-16">
        <div className="hidden lg:block">
          <span className="border-brand-200 bg-surface-elevated text-brand-700 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold">
            <Sparkles className="size-4" aria-hidden="true" />
            Your GlowCare account
          </span>
          <h2 className="text-ink mt-7 max-w-xl text-5xl leading-[1.08] font-extrabold tracking-tight">
            Your beauty routine, saved and secured.
          </h2>
          <p className="text-ink-muted mt-5 max-w-lg text-lg leading-8">
            Sign in to manage your profile, keep track of orders and enjoy a
            smoother shopping experience.
          </p>
          <div className="mt-9 flex items-center gap-3 text-sm font-semibold">
            <span className="bg-brand-100 text-brand-700 grid size-10 place-items-center rounded-full">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            Secure, cookie-based customer sessions
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">{children}</div>
      </Container>
    </section>
  );
}
