import type { Metadata } from "next";

import { AuthCard, AuthPage, ResetPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Choose a new password for your GlowCare account.",
  robots: { index: false, follow: false },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{
    email?: string | string[];
    token?: string | string[];
  }>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthPage>
      <AuthCard
        eyebrow="Secure reset"
        title="Choose a new password"
        description="Create a strong, unique password that you do not use anywhere else."
      >
        <ResetPasswordForm
          email={first(params.email)}
          token={first(params.token)}
        />
      </AuthCard>
    </AuthPage>
  );
}
