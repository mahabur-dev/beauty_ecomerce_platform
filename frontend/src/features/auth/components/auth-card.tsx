import { LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui";

interface AuthCardProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <Card className="w-full max-w-lg overflow-hidden rounded-3xl border-white/80 shadow-[0_24px_70px_rgba(151,19,63,0.14)]">
      <div className="from-brand-50 border-line border-b bg-gradient-to-br to-white px-6 py-7 sm:px-9 sm:py-8">
        <div className="text-brand-700 mb-5 flex items-center gap-2 text-xs font-bold tracking-[0.16em] uppercase">
          <span className="bg-brand-100 grid size-8 place-items-center rounded-full">
            <LockKeyhole className="size-4" aria-hidden="true" />
          </span>
          {eyebrow}
        </div>
        <h1 className="text-ink text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="text-ink-muted mt-3 max-w-md text-sm leading-6 sm:text-base">
          {description}
        </p>
      </div>
      <CardContent className="p-6 sm:p-9">{children}</CardContent>
      {footer ? (
        <div className="border-line bg-surface-subtle border-t px-6 py-5 text-center text-sm sm:px-9">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
