import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard, AuthPage, RegisterForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your secure GlowCare customer account.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
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
              href="/login"
              className="text-brand-700 font-semibold underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        }
      >
        <RegisterForm />
      </AuthCard>
    </AuthPage>
  );
}
