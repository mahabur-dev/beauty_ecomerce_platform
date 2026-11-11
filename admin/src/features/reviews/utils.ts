import type { ReviewModerationTarget } from "./contracts";

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatReviewTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? "—" : timestampFormatter.format(parsed);
}

export function formatReviewShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? "—" : shortDateFormatter.format(parsed);
}

export function formatMediaBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MODERATION_REASON_PRESETS: Record<
  ReviewModerationTarget,
  readonly string[]
> = {
  approved: [
    "Verified authentic product feedback following guidelines.",
    "Helpful customer experience approved after edit review.",
  ],
  rejected: [
    "Contains spam, promotional links, or unrelated content.",
    "Violates community guidelines regarding language or claims.",
  ],
  hidden: [
    "Temporarily hidden pending compliance and quality verification.",
    "Removed from public display due to policy violation.",
  ],
};

