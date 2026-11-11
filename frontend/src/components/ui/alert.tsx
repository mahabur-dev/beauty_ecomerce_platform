"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export type AlertTone = "error" | "success" | "warning" | "info";

export interface AlertProps {
  tone?: AlertTone;
  title?: string | undefined;
  children: ReactNode;
  action?: ReactNode | undefined;
  className?: string | undefined;
  /** Automatically dismisses the alert after the given duration (ms). Use 0 for persistent alerts. */
  durationMs?: number | undefined;
  /** Renders a manual dismiss button. Defaults to true when auto-dismiss or onDismiss is enabled. */
  dismissible?: boolean | undefined;
  /** Displays a subtle bottom countdown indicator when durationMs > 0. */
  showProgress?: boolean | undefined;
  /** Called after auto-dismiss or manual dismissal. */
  onDismiss?: (() => void) | undefined;
  /** Optional explicit identity key for JSX children so consecutive alerts reset the timer cleanly. */
  noticeKey?: string | number | undefined;
}

const alertStyles: Record<AlertTone, string> = {
  error: "border-danger-200 bg-danger-50 text-danger-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-brand-200 bg-brand-50 text-brand-800",
};

const alertProgressColors: Record<AlertTone, string> = {
  error: "bg-danger-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-brand-600",
};

const alertIcons: Record<AlertTone, typeof AlertCircle> = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

export const DEFAULT_ALERT_DISMISS_MS = 4000;

/**
 * Shared inline feedback banner styled with storefront semantic tokens.
 * Supports optional timed auto-dismissal (hover-pausable) and manual dismissal.
 */
export function Alert({
  tone = "error",
  title,
  children,
  action,
  className,
  durationMs = 0,
  dismissible,
  showProgress = true,
  onDismiss,
  noticeKey,
}: AlertProps) {
  const Icon = alertIcons[tone];
  const effectiveKey =
    noticeKey !== undefined
      ? String(noticeKey)
      : typeof children === "string"
        ? `${tone}:${title ?? ""}:${children}`
        : `${tone}:${title ?? ""}:node`;

  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const remainingRef = useRef(durationMs);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  const isVisible = dismissedKey !== effectiveKey;
  const canDismiss = dismissible ?? Boolean(durationMs > 0 || onDismiss);

  useEffect(() => {
    if (!isVisible || durationMs <= 0) {
      return;
    }

    remainingRef.current = durationMs;
    startRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      setDismissedKey(effectiveKey);
      onDismissRef.current?.();
    }, durationMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [durationMs, effectiveKey, isVisible]);

  if (!isVisible) {
    return null;
  }

  function clearActiveTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function handleMouseEnter() {
    if (durationMs <= 0 || !timerRef.current) return;
    clearActiveTimer();
    const elapsed = Date.now() - startRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    setIsPaused(true);
  }

  function handleMouseLeave() {
    if (durationMs <= 0 || !isPaused || remainingRef.current <= 0) return;
    startRef.current = Date.now();
    setIsPaused(false);
    timerRef.current = setTimeout(() => {
      setDismissedKey(effectiveKey);
      onDismissRef.current?.();
    }, remainingRef.current);
  }

  function handleManualDismiss() {
    clearActiveTimer();
    setDismissedKey(effectiveKey);
    onDismissRef.current?.();
  }

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative flex items-start gap-3 overflow-hidden rounded-xl border px-4 py-3 text-sm leading-5",
        alertStyles[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div>{children}</div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
      {canDismiss ? (
        <button
          type="button"
          onClick={handleManualDismiss}
          aria-label="Dismiss notification"
          className="text-current/70 hover:text-current focus-visible:ring-brand-500 -mr-1 -mt-0.5 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
      {showProgress && durationMs > 0 ? (
        <div
          key={effectiveKey}
          aria-hidden="true"
          className={cn(
            "absolute bottom-0 left-0 h-0.5 w-full origin-left",
            alertProgressColors[tone],
          )}
          style={{
            animation: `alert-countdown ${durationMs}ms linear forwards`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Reusable auto-dismissing feedback alert (defaults to 4 seconds with hover pause).
 */
export function DismissibleAlert({
  durationMs = DEFAULT_ALERT_DISMISS_MS,
  dismissible = true,
  ...props
}: AlertProps) {
  return (
    <Alert durationMs={durationMs} dismissible={dismissible} {...props} />
  );
}
