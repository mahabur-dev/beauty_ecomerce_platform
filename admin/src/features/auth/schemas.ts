import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Password is required.").max(255),
});

export const totpCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit authentication code."),
});

export const mfaChallengeSchema = z
  .object({
    code: z.string().trim().optional(),
    recovery_code: z.string().trim().max(40).optional(),
  })
  .refine((value) => Boolean(value.code) !== Boolean(value.recovery_code), {
    message: "Provide either an authentication code or one recovery code.",
  })
  .refine((value) => !value.code || /^\d{6}$/.test(value.code), {
    message: "Authentication codes must contain exactly six digits.",
    path: ["code"],
  });

export type AdminLoginValues = z.infer<typeof adminLoginSchema>;
export type MfaChallengeValues = z.infer<typeof mfaChallengeSchema>;
