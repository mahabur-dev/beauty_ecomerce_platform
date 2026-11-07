import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard, AuthPage, ForgotPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a secure GlowCare password reset link.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthPage>
      <AuthCard
        eyebrow="Account recovery"
        title="Reset your password"
        description="Enter your account email and we’ll send instructions if an account exists."
        footer={
          <Link
            href="/login"
            className="text-brand-700 font-semibold underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        }
      >
        <ForgotPasswordForm />
      </AuthCard>
    </AuthPage>
  );
}
