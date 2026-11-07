import { apiRequest } from "@/lib/api";
import { clearCsrfCookie } from "@/lib/api/csrf";
import type { ResourceResponse } from "@/types/api";
import type {
  AdminLoginInput,
  AdminLoginResponse,
  AdminUser,
  AuthenticatedAdminResponse,
  MfaConfirmationResponse,
  MfaSetupResponse,
} from "@/features/auth/types";

export function loginAdmin(
  input: AdminLoginInput,
): Promise<AdminLoginResponse> {
  return apiRequest("/admin/auth/login", { method: "POST", json: input });
}

export function getMfaSetup(): Promise<MfaSetupResponse> {
  return apiRequest("/admin/auth/mfa/setup");
}

export function confirmMfa(code: string): Promise<MfaConfirmationResponse> {
  return apiRequest("/admin/auth/mfa/confirm", {
    method: "POST",
    json: { code },
  });
}

export function challengeMfa(input: {
  code?: string | undefined;
  recovery_code?: string | undefined;
}): Promise<AuthenticatedAdminResponse> {
  return apiRequest("/admin/auth/mfa/challenge", {
    method: "POST",
    json: input,
  });
}

export async function getCurrentAdmin(): Promise<AdminUser> {
  const response = await apiRequest<ResourceResponse<AdminUser>>("/admin/me");
  return response.data;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await apiRequest("/admin/auth/logout", { method: "POST" });
  } finally {
    clearCsrfCookie();
  }
}
