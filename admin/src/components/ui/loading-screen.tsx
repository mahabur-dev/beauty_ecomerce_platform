import type { ReactNode } from "react";

export interface LoadingScreenProps {
  /** Main status heading or action in progress */
  readonly message?: string;
  /** Secondary explanatory text */
  readonly description?: string;
  /** Whether to occupy the full viewport height */
  readonly fullScreen?: boolean;
  /** Custom additional CSS classes */
  readonly className?: string;
  /** Optional custom footer/action (e.g. retry or cancel) */
  readonly children?: ReactNode;
}

/**
 * Enterprise-grade branded loading screen for GlowCare Admin Console.
 * Uses GlowCare vibrant magenta palette (#ed267c, #fff0f7, #fce3ef),
 * accessible ARIA status roles, and smooth pulse/spinner keyframes.
 */
export function LoadingScreen({
  message = "Checking administrator session…",
  description = "Verifying security credentials and access permissions.",
  fullScreen = true,
  className = "",
  children,
}: LoadingScreenProps) {
  const containerClass = fullScreen
    ? "fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#f8fafc] p-6 text-center"
    : "flex min-h-[360px] w-full flex-col items-center justify-center rounded-2xl bg-[#f8fafc]/60 p-8 text-center";

  return (
    <main
      className={`${containerClass} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Decorative ambient blush glow */}
      {fullScreen && (
        <>
          <div
            className="pointer-events-none absolute -top-32 left-1/2 h-[350px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#fce3ef]/80 via-[#fff0f7]/40 to-transparent blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-20 -bottom-20 h-[260px] w-[260px] rounded-full bg-[#fff0f7] opacity-60 blur-2xl"
            aria-hidden="true"
          />
        </>
      )}

      {/* Branded loading card */}
      <div className="relative z-10 flex max-w-sm flex-col items-center">
        {/* GlowCare badge with pulse and ring */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Animated spinner ring around logo */}
          <div className="absolute -inset-2.5">
            <svg
              className="gc-loader-ring h-19 w-19 text-[#ed267c]"
              viewBox="0 0 76 76"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="38"
                cy="38"
                r="33"
                stroke="#fce3ef"
                strokeWidth="3.5"
                strokeDasharray="6 6"
              />
              <path
                d="M38 5 A33 33 0 0 1 71 38"
                stroke="url(#gc-ring-gradient)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient
                  id="gc-ring-gradient"
                  x1="38"
                  y1="5"
                  x2="71"
                  y2="38"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#ed267c" />
                  <stop offset="1" stopColor="#f63d93" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Central brand mark container */}
          <div
            className="gc-loader-badge flex h-14 w-14 items-center justify-center rounded-2xl border border-[#fbd3e5] bg-gradient-to-br from-[#fff0f7] to-[#fce3ef] text-3xl text-[#ed267c] shadow-[0_4px_16px_rgba(237,38,124,0.18)] select-none"
            aria-hidden="true"
          >
            ✿
          </div>
        </div>

        {/* Brand identity */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-[#0f172a]">
            GlowCare
          </span>
          <span className="rounded-full border border-[#fbd3e5] bg-[#fff0f7] px-2 py-0.5 text-[9.5px] font-extrabold tracking-wider text-[#ed267c] uppercase">
            Admin Console
          </span>
        </div>

        {/* Status message */}
        <h2 className="text-sm font-bold tracking-tight text-[#1e293b] sm:text-base">
          {message}
        </h2>

        {/* Description */}
        {description && (
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed font-normal text-[#64748b]">
            {description}
          </p>
        )}

        {/* Optional custom children */}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </main>
  );
}
