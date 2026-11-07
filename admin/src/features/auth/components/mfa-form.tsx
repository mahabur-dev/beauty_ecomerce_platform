"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { useQueryClient } from "@tanstack/react-query";
import { challengeMfa, confirmMfa, getMfaSetup } from "@/features/auth/api";
import { mfaChallengeSchema, totpCodeSchema } from "@/features/auth/schemas";
import { currentAdminQuery } from "@/features/auth/query-options";
import { isAuthorizedAdmin, safeInternalPath } from "@/features/auth/session";
import type { MfaSetupResponse } from "@/features/auth/types";
import { ApiError } from "@/lib/api";
import { Icon } from "@/components/ui/icon";

export function MfaForm({ mode }: { mode: "setup" | "challenge" }) {
  const router = useRouter();
  const params = useSearchParams();
  const client = useQueryClient();
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(mode === "setup");

  useEffect(() => {
    if (mode !== "setup") return;
    let active = true;
    void getMfaSetup()
      .then((result) => {
        if (active) setSetup(result);
      })
      .catch(() => {
        if (active) setError("Unable to initialize MFA. Sign in again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const validation =
      mode === "setup"
        ? totpCodeSchema.safeParse({ code })
        : mfaChallengeSchema.safeParse(
            useRecovery ? { recovery_code: code } : { code },
          );
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Invalid code.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (mode === "setup") {
        const result = await confirmMfa(code);
        if (!isAuthorizedAdmin(result.user)) {
          throw new Error("Administrator access is not available.");
        }
        client.setQueryData(currentAdminQuery.queryKey, result.user);
        setRecoveryCodes(result.recovery_codes);
        return;
      }
      const result = await challengeMfa(
        useRecovery ? { recovery_code: code } : { code },
      );
      if (!isAuthorizedAdmin(result.user)) {
        throw new Error("Administrator access is not available.");
      }
      client.setQueryData(currentAdminQuery.queryKey, result.user);
      router.replace(safeInternalPath(params.get("next")) as Route);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Verification failed. Please sign in again if the session expired.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (recoveryCodes) {
    return (
      <section className="grid gap-5">
        <div className="flex items-start gap-2 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-xs text-[#166534]">
          <Icon
            name="award"
            size={16}
            className="mt-0.5 shrink-0 text-[#16a34a]"
          />
          <p className="leading-relaxed">
            Multi-factor authentication enabled successfully. Store these
            recovery codes securely.
          </p>
        </div>

        <div className="grid gap-2">
          <p className="text-xs font-semibold text-[#434557]">
            Your emergency recovery codes:
          </p>
          <ul className="grid grid-cols-2 gap-2 rounded-xl border border-[#e6e7ee] bg-[#fcfcfe] p-3 font-mono text-xs text-[#202133]">
            {recoveryCodes.map((value) => (
              <li
                key={value}
                className="rounded border border-[#ebedf3] bg-white px-2 py-1 text-center select-all"
              >
                {value}
              </li>
            ))}
          </ul>
        </div>

        <button
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ed267c] to-[#f63d93] px-4 py-3 text-xs font-bold text-white shadow-[0_4px_14px_rgba(237,38,124,0.32)] transition-all hover:from-[#c71862] hover:to-[#ed267c] sm:text-sm"
          type="button"
          onClick={() =>
            router.replace(safeInternalPath(params.get("next")) as Route)
          }
        >
          <span>I saved my recovery codes — continue</span>
          <Icon name="arrow" size={15} />
        </button>
      </section>
    );
  }

  return (
    <section className="grid gap-4.5">
      <div className="text-center">
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#fbd3e5] bg-gradient-to-br from-[#fff0f7] to-[#fce3ef] text-[#ed267c] shadow-sm"
          aria-hidden="true"
        >
          <Icon name="shield" size={22} />
        </div>
        <h1 className="text-base font-bold text-[#202133] sm:text-lg">
          {mode === "setup"
            ? "Set up Two-Factor Authentication"
            : "Verify Identity"}
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-[#777b91]">
          {mode === "setup"
            ? "Scan or enter the secret key into Google Authenticator or your TOTP app."
            : "Enter the code from your authenticator app to access the admin console."}
        </p>
      </div>

      {mode === "setup" && (
        <div className="grid gap-1.5 rounded-xl border border-[#e6e7ee] bg-[#fcfcfe] p-3.5 text-xs text-[#434557]">
          <span className="text-[11px] font-semibold tracking-wider text-[#777b91] uppercase">
            Authenticator Secret Key
          </span>
          <strong className="block rounded-lg border border-[#fce3ef] bg-white px-2.5 py-1.5 font-mono text-xs break-all text-[#ed267c] select-all">
            {loading ? "Generating secret…" : (setup?.secret ?? "Unavailable")}
          </strong>
        </div>
      )}

      <form onSubmit={(event) => void submit(event)} className="grid gap-3.5">
        <div className="grid gap-1.5">
          <label
            htmlFor="mfa-code"
            className="text-xs font-semibold text-[#434557]"
          >
            {useRecovery
              ? "Emergency recovery code"
              : "6-digit authentication code"}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 flex -translate-y-1/2 items-center text-[#a1a4b5]">
              <Icon name="lock" size={17} />
            </span>
            <input
              id="mfa-code"
              className="w-full rounded-xl border border-[#e6e7ee] bg-[#fcfcfe] py-2.5 pr-3.5 pl-10 font-mono text-xs tracking-widest text-[#202133] transition-all placeholder:text-[#a3a4b0] focus:border-[#ed267c] focus:bg-white focus:ring-4 focus:ring-[#fce3ef] focus:outline-none sm:text-sm"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              inputMode={useRecovery ? "text" : "numeric"}
              placeholder={useRecovery ? "xxxxxxxxxx" : "000000"}
              required
              disabled={busy || loading}
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-[#ffd2df] bg-[#fff0f4] p-3 text-xs text-[#c71862]"
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
          className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ed267c] to-[#f63d93] px-4 py-3 text-xs font-bold text-white shadow-[0_4px_14px_rgba(237,38,124,0.32)] transition-all hover:from-[#c71862] hover:to-[#ed267c] disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
          disabled={busy || loading || (mode === "setup" && !setup)}
          type="submit"
        >
          {busy ? (
            <>
              <Icon name="refresh" size={16} className="animate-spin" />
              <span>Verifying code…</span>
            </>
          ) : (
            <>
              <span>Verify and proceed</span>
              <Icon name="arrow" size={15} />
            </>
          )}
        </button>
      </form>

      <div className="flex items-center justify-between border-t border-[#f0f1f6] pt-2 text-xs">
        {mode === "challenge" ? (
          <button
            type="button"
            className="cursor-pointer font-medium text-[#ed267c] hover:underline"
            onClick={() => {
              setUseRecovery((value) => !value);
              setCode("");
              setError("");
            }}
          >
            {useRecovery
              ? "Use 6-digit authenticator code"
              : "Use emergency recovery code"}
          </button>
        ) : (
          <span />
        )}
        <Link
          href="/login"
          className="text-[#777b91] transition-colors hover:text-[#202133] hover:underline"
        >
          Return to sign in
        </Link>
      </div>
    </section>
  );
}
