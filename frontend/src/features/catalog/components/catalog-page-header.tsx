import { Container } from "@/components/ui";

export function CatalogPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-brand-100 bg-brand-50/70 border-y">
      <Container className="py-10 sm:py-14">
        <p className="text-brand-700 text-xs font-bold tracking-[0.18em] uppercase">
          {eyebrow}
        </p>
        <h1 className="text-ink mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="text-ink-muted mt-3 max-w-2xl text-sm leading-6 sm:text-base">
          {description}
        </p>
      </Container>
    </div>
  );
}
