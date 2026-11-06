import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.")
  .max(255, "Email address is too long.");

const strongPassword = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(4096, "Password is too long.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.")
  .regex(/[^A-Za-z0-9]/, "Include a symbol.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(4096),
  remember: z.boolean(),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(160, "Name is too long."),
    email,
    password: strongPassword,
    password_confirmation: z.string(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match.",
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    email,
    token: z.string().min(1, "The reset link is incomplete."),
    password: strongPassword,
    password_confirmation: z.string(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match.",
  });

export type AuthFieldErrors = Record<string, string | undefined>;

export function zodFieldErrors(error: z.ZodError): AuthFieldErrors {
  const flattened = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}
