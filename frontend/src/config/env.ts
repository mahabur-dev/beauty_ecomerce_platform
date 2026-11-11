import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";
const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "true" ||
  process.env.SKIP_ENV_VALIDATION === "1";

/**
 * Validates a public storefront URL string.
 *
 * Normalizes empty strings to undefined so unpopulated environment entries
 * are either defaulted (in non-production or when SKIP_ENV_VALIDATION is set)
 * or caught by strict validation (in production).
 */
function publicUrl(defaultValue: string) {
  return z.preprocess((value) => {
    const normalized =
      typeof value === "string" && value.trim() === "" ? undefined : value;

    if (normalized === undefined && (!isProduction || skipValidation)) {
      return defaultValue;
    }

    return normalized;
  }, z.string().trim().url());
}

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1).default("GlowCare"),
  NEXT_PUBLIC_APP_URL: publicUrl("http://localhost:3000"),
  NEXT_PUBLIC_API_BASE_URL: publicUrl("http://localhost:8000/api/v1"),
  NEXT_PUBLIC_REVIEW_VIDEO_ENABLED: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .default("false")
    .transform((value) => value === "true" || value === "1"),
});

const rawEnvironment = {
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_REVIEW_VIDEO_ENABLED:
    process.env.NEXT_PUBLIC_REVIEW_VIDEO_ENABLED,
};

const parsedResult = publicEnvironmentSchema.safeParse(rawEnvironment);

if (!parsedResult.success) {
  const issues = parsedResult.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  console.error(
    `\n❌ [Environment Validation Error] Invalid or missing public configuration:\n` +
      `${issues}\n\n` +
      `💡 How to fix:\n` +
      `   For local development and builds, ensure a .env.local file exists:\n` +
      `     cp .env.example .env.local\n` +
      `   For deployment, set the required NEXT_PUBLIC_* variables in your environment.\n` +
      `   To skip validation during CI/pipeline build checks, set SKIP_ENV_VALIDATION=1.\n`,
  );

  throw new Error(
    "Invalid public environment configuration. Please check the logs above.",
  );
}

const parsed = parsedResult.data;

export const env = Object.freeze({
  appName: parsed.NEXT_PUBLIC_APP_NAME,
  appUrl: parsed.NEXT_PUBLIC_APP_URL,
  apiBaseUrl: parsed.NEXT_PUBLIC_API_BASE_URL,
  reviewVideoEnabled: parsed.NEXT_PUBLIC_REVIEW_VIDEO_ENABLED,
});
