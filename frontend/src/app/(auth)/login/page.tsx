import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard, AuthPage, LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in securely to your GlowCare customer account.",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = Array.isArray(params.next) ? params.next[0] : params.next;

  return (
    <AuthPage>
      <AuthCard
        eyebrow="Welcome back"
        title="Sign in to GlowCare"
        description="Access your profile and continue your beauty and wellness journey."
        footer={
          <p className="text-ink-muted">
            New to GlowCare?{" "}
            <Link
              href="/register"
              className="text-brand-700 font-semibold underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        }
      >
        <LoginForm nextPath={nextPath} />
      </AuthCard>
    </AuthPage>
  );
}
