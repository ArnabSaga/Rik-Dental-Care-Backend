export type TAuthUserRole = "PATIENT" | "MANAGER" | "ADMIN";
export type TAuthUserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IForgotPasswordPayload {
  email: string;
}

export interface IVerifyEmailPayload {
  email: string;
  otp: string;
}

export interface IResendVerificationPayload {
  email: string;
}

export interface IResetPasswordPayload {
  email: string;
  otp: string;
  password: string;
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}

export interface IGoogleLoginPayload {
  callbackURL?: string;
}

export interface IAuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: TAuthUserRole;
  status: TAuthUserStatus;
  phone?: string | null;
  image?: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoginServiceResult {
  authHeaders: Headers;
  data: {
    user: IAuthUserResponse;
    session: unknown;
  };
}
