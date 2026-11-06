import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16 lg:px-8">
      <section
        className="border-brand-100 bg-surface-elevated shadow-soft w-full rounded-3xl border p-8 sm:p-12"
        aria-labelledby="foundation-title"
      >
        <p className="text-brand-700 text-sm font-semibold tracking-widest uppercase">
          Frontend foundation
        </p>
        <h1
          id="foundation-title"
          className="text-ink mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl"
        >
          {siteConfig.name} is ready for the design phase.
        </h1>
        <p className="text-ink-muted mt-5 max-w-2xl text-base leading-7 sm:text-lg">
          The application shell, API boundary, environment validation, design
          tokens, server-state provider, and automated test foundation are in
          place.
        </p>
      </section>
    </main>
  );
}
