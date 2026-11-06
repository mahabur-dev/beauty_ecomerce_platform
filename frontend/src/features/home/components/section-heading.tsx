import { ArrowRight } from "lucide-react";

interface SectionHeadingProps {
  title: string;
  actionLabel: string;
  actionHref: string;
}

export function SectionHeading({
  actionHref,
  actionLabel,
  title,
}: SectionHeadingProps) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h2 className="text-ink text-2xl font-extrabold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <a
        href={actionHref}
        className="text-brand-600 hover:text-brand-700 inline-flex items-center gap-2 text-sm font-bold transition"
      >
        <span className="hidden sm:inline">{actionLabel}</span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </a>
    </div>
  );
}
