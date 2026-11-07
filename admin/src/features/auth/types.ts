export type AdminRole = "super_admin" | "catalog_manager";
export type AuthenticationNextStep = "mfa_setup" | "mfa_challenge";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
  vendor_id: number | null;
  roles: Array<AdminRole | "customer">;
  mfa_enabled: boolean;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  next: AuthenticationNextStep;
}

export interface MfaSetupResponse {
  secret: string;
  provisioning_uri: string;
}

export interface AuthenticatedAdminResponse {
  user: AdminUser;
}

export interface MfaConfirmationResponse extends AuthenticatedAdminResponse {
  recovery_codes: string[];
}
