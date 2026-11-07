import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

function publicUrl(defaultValue: string) {
  return z.preprocess(
    (value) => (value === undefined && !isProduction ? defaultValue : value),
    z.string().url(),
  );
}

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1).default("GlowCare"),
  NEXT_PUBLIC_APP_URL: publicUrl("http://localhost:3000"),
  NEXT_PUBLIC_API_BASE_URL: publicUrl("http://localhost:8000/api/v1"),
});

const parsedEnvironment = publicEnvironmentSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export const env = Object.freeze({
  appName: parsedEnvironment.NEXT_PUBLIC_APP_NAME,
  appUrl: parsedEnvironment.NEXT_PUBLIC_APP_URL,
  apiBaseUrl: parsedEnvironment.NEXT_PUBLIC_API_BASE_URL,
});
