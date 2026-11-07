export interface SpinnerProps {
  readonly size?: "sm" | "md" | "lg" | "xl";
  readonly className?: string;
  readonly label?: string;
}

const SIZE_MAP = {
  sm: 16,
  md: 24,
  lg: 36,
  xl: 48,
} as const;

export function Spinner({
  size = "md",
  className = "",
  label = "Loading…",
}: SpinnerProps) {
  const pixelSize = SIZE_MAP[size];

  return (
    <svg
      className={`gc-loader-ring ${className}`}
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label={label}
    >
      <circle
        className="text-[#ed267c] opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="text-[#ed267c]"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
