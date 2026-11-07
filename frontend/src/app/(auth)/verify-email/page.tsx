import type { Metadata } from "next";
import { Suspense } from "react";

import {
  AuthCard,
  AuthPage,
  AuthRouteFallback,
  VerifyEmailPanel,
} from "@/features/auth";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your GlowCare customer email address.",
  robots: { index: false, follow: false },
};

interface VerifyEmailPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  return (
    <Suspense fallback={<AuthRouteFallback />}>
      <VerifyEmailContent searchParams={searchParams} />
    </Suspense>
  );
}

async function VerifyEmailContent({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const id = first(params.id);
  const hash = first(params.hash);
  const expires = first(params.expires);
  const signature = first(params.signature);
  const verification =
    id && hash && expires && signature
      ? { id, hash, expires, signature }
      : undefined;

  return (
    <AuthPage>
      <AuthCard
        eyebrow="One last step"
        title="Verify your email"
        description="Email verification protects your account and confirms where we should reach you."
      >
        <VerifyEmailPanel verification={verification} />
      </AuthCard>
    </AuthPage>
  );
}
