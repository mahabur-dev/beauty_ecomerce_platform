"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAdmin } from "@/features/auth/use-admin";
import { isAuthorizedAdmin } from "@/features/auth/session";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, error, isPending, refetch } = useAdmin();
  const unauthorized =
    error instanceof ApiError &&
    (error.problem.status === 401 || error.problem.status === 419);
  const allowed = Boolean(data && isAuthorizedAdmin(data));

  useEffect(() => {
    if (unauthorized)
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [unauthorized, pathname, router]);

  if (isPending || unauthorized)
    return (
      <main className="p-6" role="status">
        Checking administrator session…
      </main>
    );
  if (error) {
    return (
      <main className="p-6" role="alert">
        <h1>Session unavailable</h1>
        <p>Unable to verify your administrator session.</p>
        <button type="button" onClick={() => void refetch()}>
          Retry
        </button>
      </main>
    );
  }
  if (!allowed)
    return (
      <main className="p-6" role="alert">
        <h1>Access denied</h1>
        <p>Your account does not have verified administrator access.</p>
      </main>
    );
  return <>{children}</>;
}
