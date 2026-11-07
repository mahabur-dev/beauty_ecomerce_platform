export interface AuthUser {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
  vendor_id: number | null;
  roles: string[];
  mfa_enabled: boolean;
}

export interface AuthUserResponse {
  data: AuthUser;
}

export interface MessageResponse {
  message: string;
}

export interface LoginInput {
  email: string;
  password: string;
  remember: boolean;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordInput {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}
