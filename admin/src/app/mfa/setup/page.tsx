import type { Metadata } from "next";
import { Suspense } from "react";
import { MfaForm } from "@/features/auth/components/mfa-form";

export const metadata: Metadata = {
  title: "Set Up MFA | GlowCare Admin",
  description:
    "Set up two-factor authentication for GlowCare administrator portal.",
  robots: { index: false, follow: false },
};

export default function MfaSetupPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#f7f7fb] p-4 sm:p-6">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[650px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#fce3ef]/70 via-[#fff0f7]/40 to-transparent opacity-80 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 -bottom-20 h-[300px] w-[300px] rounded-full bg-[#fff0f7] opacity-60 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-[#ebedf3] bg-white p-6 shadow-[0_16px_40px_rgba(32,33,51,0.06),0_2px_8px_rgba(237,38,124,0.06)] sm:rounded-3xl sm:p-9">
        <Suspense
          fallback={
            <div
              className="py-12 text-center text-xs text-[#777b91]"
              role="status"
            >
              Loading setup…
            </div>
          }
        >
          <MfaForm mode="setup" />
        </Suspense>
      </div>

      <footer className="relative z-10 mt-7 text-center text-[11px] text-[#9ca0ae]">
        <p>GlowCare Commerce Platform • Restricted Administration Portal</p>
      </footer>
    </main>
  );
}
