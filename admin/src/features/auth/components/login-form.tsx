"use client";

import { useState, type FormEvent } from "react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { loginAdmin } from "@/features/auth/api";
import { adminLoginSchema } from "@/features/auth/schemas";
import { safeInternalPath } from "@/features/auth/session";
import { currentAdminQuery } from "@/features/auth/query-options";
import { ApiError } from "@/lib/api";
import { Icon } from "@/components/ui/icon";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = adminLoginSchema.safeParse({ email, password });
    if (!values.success) {
      setError(values.error.issues[0]?.message ?? "Invalid credentials.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await loginAdmin(values.data);
      void result;
      client.removeQueries({ queryKey: currentAdminQuery.queryKey });

      /*
      // [MFA FLOW - TEMPORARILY DISABLED]
      // Uncomment below when re-enabling MFA:
      if (result.next !== "mfa_setup" && result.next !== "mfa_challenge") {
        throw new Error("Unexpected authentication response.");
      }
      const next = encodeURIComponent(
        safeInternalPath(searchParams.get("next")),
      );
      router.replace(
        `/mfa/${result.next === "mfa_setup" ? "setup" : "challenge"}?next=${next}`,
      );
      */

      // [DIRECT DASHBOARD ACCESS - TEMPORARY BYPASS]
      const destination = safeInternalPath(searchParams.get("next"));
      router.replace(destination as Route);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Login failed. Please verify your credentials and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="grid gap-4.5"
      noValidate
    >
      <div className="grid gap-1.5">
        <label
          htmlFor="admin-email"
          className="text-xs font-semibold text-[#434557]"
        >
          Administrator email
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 flex -translate-y-1/2 items-center text-[#a1a4b5]">
            <Icon name="mail" size={17} />
          </span>
          <input
            id="admin-email"
            className="w-full rounded-xl border border-[#e6e7ee] bg-[#fcfcfe] py-2.5 pr-3.5 pl-10 text-xs text-[#202133] transition-all placeholder:text-[#a3a4b0] focus:border-[#ed267c] focus:bg-white focus:ring-4 focus:ring-[#fce3ef] focus:outline-none sm:text-sm"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@glowcare.com"
            required
            disabled={busy}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor="admin-password"
          className="text-xs font-semibold text-[#434557]"
        >
          Password
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 flex -translate-y-1/2 items-center text-[#a1a4b5]">
            <Icon name="lock" size={17} />
          </span>
          <input
            id="admin-password"
            className="w-full rounded-xl border border-[#e6e7ee] bg-[#fcfcfe] py-2.5 pr-10 pl-10 text-xs text-[#202133] transition-all placeholder:text-[#a3a4b0] focus:border-[#ed267c] focus:bg-white focus:ring-4 focus:ring-[#fce3ef] focus:outline-none sm:text-sm"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 text-[#a1a4b5] transition-colors hover:text-[#434557] focus:text-[#ed267c] focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} size={17} />
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="animate-fadeIn flex items-start gap-2.5 rounded-xl border border-[#ffd2df] bg-[#fff0f4] p-3 text-xs text-[#c71862]"
        >
          <Icon
            name="warning"
            size={16}
            className="mt-0.5 shrink-0 text-[#ed267c]"
          />
          <span className="leading-relaxed font-medium">{error}</span>
        </div>
      )}

      <button
        className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ed267c] to-[#f63d93] px-4 py-3 text-xs font-bold text-white shadow-[0_4px_14px_rgba(237,38,124,0.32)] transition-all duration-150 hover:from-[#c71862] hover:to-[#ed267c] hover:shadow-[0_6px_20px_rgba(237,38,124,0.42)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
        type="submit"
        disabled={busy}
      >
        {busy ? (
          <>
            <Icon name="refresh" size={16} className="animate-spin" />
            <span>Authenticating…</span>
          </>
        ) : (
          <>
            <span>Sign in to console</span>
            <Icon name="arrow" size={15} />
          </>
        )}
      </button>

      {/* 
      // [MFA BADGE - TEMPORARILY HIDDEN]
      <div className="mt-3 flex items-center justify-center gap-2 border-t border-[#f0f1f6] pt-4 text-[11px] text-[#777b91]">
        <Icon name="shield" size={14} className="text-[#ed267c]" />
        <span>Enterprise MFA verification required</span>
      </div>
      */}
    </form>
  );
}
