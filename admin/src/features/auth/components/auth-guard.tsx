"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAdmin } from "@/features/auth/use-admin";
import { isAuthorizedAdmin } from "@/features/auth/session";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Icon } from "@/components/ui/icon";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, error, isPending, refetch } = useAdmin();
  const unauthorized =
    error instanceof ApiError &&
    (error.problem.status === 401 ||
      error.problem.status === 419 ||
      (error.problem.status === 403 && error.problem.title === "MFA required"));
  const allowed = Boolean(data && isAuthorizedAdmin(data));

  useEffect(() => {
    if (unauthorized)
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [unauthorized, pathname, router]);

  if (isPending || unauthorized) {
    return (
      <LoadingScreen
        message="Checking administrator session…"
        description="Verifying security credentials and access permissions."
      />
    );
  }

  if (error) {
    return (
      <main
        className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-[#f8fafc] p-6 text-center"
        role="alert"
      >
        <div className="relative z-10 flex max-w-sm flex-col items-center rounded-2xl border border-[#ebedf3] bg-white p-7 shadow-[0_12px_32px_rgba(32,33,51,0.06)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff1f2] text-[#e11d48]">
            <Icon name="shield" size={24} />
          </div>
          <h1 className="text-base font-bold text-[#0f172a]">
            Session unavailable
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-[#64748b]">
            Unable to verify your administrator session. Please check your
            connection and retry.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#ed267c] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(237,38,124,0.25)] transition hover:bg-[#c71862]"
          >
            Retry session check
          </button>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main
        className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-[#f8fafc] p-6 text-center"
        role="alert"
      >
        <div className="relative z-10 flex max-w-sm flex-col items-center rounded-2xl border border-[#ebedf3] bg-white p-7 shadow-[0_12px_32px_rgba(32,33,51,0.06)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff1f2] text-[#e11d48]">
            <Icon name="shield" size={24} />
          </div>
          <h1 className="text-base font-bold text-[#0f172a]">Access denied</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-[#64748b]">
            Your account does not have verified administrator access for
            GlowCare.
          </p>
          <button
            type="button"
            onClick={() =>
              router.replace(`/login?next=${encodeURIComponent(pathname)}`)
            }
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#ed267c] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(237,38,124,0.25)] transition hover:bg-[#c71862]"
          >
            Sign in with another account
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
