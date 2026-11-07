import { z } from "zod";

export const adminRoleSchema = z.enum(["super_admin", "catalog_manager"]);

export const adminUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.email(),
  email_verified: z.boolean(),
  is_active: z.boolean(),
  vendor_id: z.number().int().positive().nullable(),
  roles: z.array(z.union([adminRoleSchema, z.literal("customer")])),
  mfa_enabled: z.boolean(),
});

export const adminLoginResponseSchema = z.object({
  next: z.enum(["mfa_setup", "mfa_challenge"]),
});

export const mfaSetupResponseSchema = z.object({
  secret: z.string().min(1),
  provisioning_uri: z.string().startsWith("otpauth://"),
});

export const authenticatedAdminResponseSchema = z.object({
  user: adminUserSchema,
});

export const mfaConfirmationResponseSchema =
  authenticatedAdminResponseSchema.extend({
    recovery_codes: z.array(z.string().min(1)).min(1),
  });

export const adminResourceResponseSchema = z.object({ data: adminUserSchema });

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
