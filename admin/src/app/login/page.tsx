import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Administrator Sign In | GlowCare Admin",
  description: "Secure administrator sign in for GlowCare platform.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#f7f7fb] p-4 sm:p-6">
      {/* Decorative ambient brand glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[650px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#fce3ef]/70 via-[#fff0f7]/40 to-transparent opacity-80 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 -bottom-20 h-[300px] w-[300px] rounded-full bg-[#fff0f7] opacity-60 blur-2xl"
        aria-hidden="true"
      />

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-[430px] rounded-2xl border border-[#ebedf3] bg-white p-6 shadow-[0_16px_40px_rgba(32,33,51,0.06),0_2px_8px_rgba(237,38,124,0.06)] sm:rounded-3xl sm:p-9">
        {/* Brand header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="mb-3.5 flex h-13 w-13 -rotate-6 transform items-center justify-center rounded-2xl border border-[#fbd3e5] bg-gradient-to-br from-[#fff0f7] to-[#fce3ef] text-3xl text-[#ed267c] shadow-sm select-none"
            aria-hidden="true"
          >
            ✿
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-[#202133]">
              GlowCare
            </span>
            <span className="rounded-full border border-[#fbd3e5] bg-[#fff0f7] px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#ed267c] uppercase">
              Admin Console
            </span>
          </div>
          <h1 className="mt-3 text-base font-bold text-[#202133] sm:text-lg">
            Administrator Sign In
          </h1>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#777b91]">
            Enter your credentials to manage catalog, operations, and store
            settings.
          </p>
        </div>

        {/* Login form with suspense */}
        <Suspense
          fallback={
            <div
              className="py-12 text-center text-xs text-[#777b91]"
              role="status"
            >
              Loading sign in form…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      {/* Portal footer */}
      <footer className="relative z-10 mt-7 text-center text-[11px] text-[#9ca0ae]">
        <p>GlowCare Commerce Platform • Restricted Administration Portal</p>
      </footer>
    </main>
  );
}
