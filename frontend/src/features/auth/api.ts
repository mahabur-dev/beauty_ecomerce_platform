import { env } from "@/config/env";
import { apiRequest } from "@/lib/api/client";

import type {
  AuthUser,
  AuthUserResponse,
  LoginInput,
  MessageResponse,
  RegisterInput,
  ResetPasswordInput,
} from "./types";

function apiOrigin(): string {
  return new URL(env.apiBaseUrl).origin;
}

function readBrowserCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
}

export async function initializeCsrfProtection(): Promise<string> {
  const response = await fetch(`${apiOrigin()}/sanctum/csrf-cookie`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to initialize a secure session.");
  }

  const token = readBrowserCookie("XSRF-TOKEN");

  if (!token) {
    throw new Error("The secure session cookie was not received.");
  }

  return token;
}

async function authenticatedMutation<T>(
  path: string,
  options: { method?: "POST"; json?: unknown } = {},
): Promise<T> {
  const csrfToken = await initializeCsrfProtection();

  return apiRequest<T>(path, {
    method: options.method ?? "POST",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "X-XSRF-TOKEN": csrfToken,
    },
    ...(options.json === undefined ? {} : { json: options.json }),
  });
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const response = await authenticatedMutation<AuthUserResponse>(
    "/auth/login",
    { json: input },
  );

  return response.data;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  const response = await authenticatedMutation<AuthUserResponse>(
    "/auth/register",
    { json: input },
  );

  return response.data;
}

export async function logout(): Promise<void> {
  await authenticatedMutation<void>("/auth/logout");
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiRequest<AuthUserResponse>("/auth/me");

    return response.data;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 401
    ) {
      return null;
    }

    throw error;
  }
}

export function requestPasswordReset(email: string): Promise<MessageResponse> {
  return authenticatedMutation<MessageResponse>("/auth/forgot-password", {
    json: { email },
  });
}

export function resetPassword(
  input: ResetPasswordInput,
): Promise<MessageResponse> {
  return authenticatedMutation<MessageResponse>("/auth/reset-password", {
    json: input,
  });
}

export function resendVerificationEmail(): Promise<MessageResponse> {
  return authenticatedMutation<MessageResponse>(
    "/auth/email/verification-notification",
  );
}

interface VerificationInput {
  id: string;
  hash: string;
  expires: string;
  signature: string;
}

export function verifyEmail(input: VerificationInput): Promise<void> {
  const query = new URLSearchParams({
    expires: input.expires,
    signature: input.signature,
  });

  return apiRequest<void>(
    `/auth/email/verify/${encodeURIComponent(input.id)}/${encodeURIComponent(input.hash)}?${query.toString()}`,
  );
}
