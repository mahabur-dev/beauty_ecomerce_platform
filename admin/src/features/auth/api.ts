import { apiRequest } from "@/lib/api";
import { clearCsrfCookie } from "@/lib/api/csrf";
import { ApiContractError } from "@/lib/api/errors";
import {
  adminLoginResponseSchema,
  adminResourceResponseSchema,
  authenticatedAdminResponseSchema,
  mfaConfirmationResponseSchema,
  mfaSetupResponseSchema,
} from "@/features/auth/schemas";
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
  return requestAuthContract(
    apiRequest("/admin/auth/login", { method: "POST", json: input }),
    adminLoginResponseSchema,
  );
}

export function getMfaSetup(): Promise<MfaSetupResponse> {
  return requestAuthContract(
    apiRequest("/admin/auth/mfa/setup"),
    mfaSetupResponseSchema,
  );
}

export function confirmMfa(code: string): Promise<MfaConfirmationResponse> {
  return requestAuthContract(
    apiRequest("/admin/auth/mfa/confirm", {
      method: "POST",
      json: { code },
    }),
    mfaConfirmationResponseSchema,
  );
}

export function challengeMfa(input: {
  code?: string | undefined;
  recovery_code?: string | undefined;
}): Promise<AuthenticatedAdminResponse> {
  return requestAuthContract(
    apiRequest("/admin/auth/mfa/challenge", {
      method: "POST",
      json: input,
    }),
    authenticatedAdminResponseSchema,
  );
}

export async function getCurrentAdmin(): Promise<AdminUser> {
  const response = await requestAuthContract(
    apiRequest("/admin/me"),
    adminResourceResponseSchema,
  );
  return response.data;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await apiRequest("/admin/auth/logout", { method: "POST" });
  } finally {
    clearCsrfCookie();
  }
}

type ContractParser<T> = {
  parse(value: unknown): T;
};

async function requestAuthContract<T>(
  request: Promise<unknown>,
  schema: ContractParser<T>,
): Promise<T> {
  const response = await request;

  try {
    return schema.parse(response);
  } catch (error) {
    throw new ApiContractError(error);
  }
}
