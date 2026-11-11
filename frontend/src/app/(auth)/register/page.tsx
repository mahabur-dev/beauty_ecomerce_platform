import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import {
  AuthCard,
  AuthPage,
  AuthRouteFallback,
  RegisterForm,
} from "@/features/auth";
import { buildAuthHrefWithNext } from "@/features/auth/utils";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your secure GlowCare customer account.",
  robots: { index: false, follow: false },
};

interface RegisterPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return (
    <Suspense fallback={<AuthRouteFallback />}>
      <RegisterContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterContent({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const nextPath = Array.isArray(params.next) ? params.next[0] : params.next;
  const loginHref = buildAuthHrefWithNext("/login", nextPath);

  return (
    <AuthPage>
      <AuthCard
        eyebrow="Join GlowCare"
        title="Create your account"
        description="Save your details and enjoy a more personal shopping experience."
        footer={
          <p className="text-ink-muted">
            Already have an account?{" "}
            <Link
              href={loginHref}
              className="text-brand-700 font-semibold underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        }
      >
        <RegisterForm nextPath={nextPath} />
      </AuthCard>
    </AuthPage>
  );
}
