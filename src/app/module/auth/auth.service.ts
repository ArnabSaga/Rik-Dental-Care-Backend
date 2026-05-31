import { Request } from "express";
import status from "http-status";
import { envVars } from "../../config/env";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";
import {
  IChangePasswordPayload,
  IForgotPasswordPayload,
  IGoogleLoginPayload,
  ILoginPayload,
  ILoginServiceResult,
  IRegisterPayload,
  IResendVerificationPayload,
  IResetPasswordPayload,
  IVerifyEmailPayload,
} from "./auth.interface";
import { buildAuthHeaders, throwBetterAuthError } from "./auth.utils";

const USER_ROLE = {
  PATIENT: "PATIENT",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
} as const;

const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
} as const;

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  phone: true,
  image: true,
  emailVerified: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizeUrl = (url: string): string => url.replace(/\/$/, "");

const ensureUserCanLogin = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizeEmail(email),
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      status: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
  }

  if (user.isDeleted) {
    throw new AppError(status.FORBIDDEN, "This account has been deleted");
  }

  if (!user.isActive || user.status !== USER_STATUS.ACTIVE) {
    throw new AppError(status.FORBIDDEN, "This account is not active");
  }

  return user;
};

const getUserByEmailOrThrow = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizeEmail(email),
        mode: "insensitive",
      },
      isDeleted: false,
    },
    select: authUserSelect,
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return user;
};

const register = async (payload: IRegisterPayload) => {
  const email = normalizeEmail(payload.email);

  const existingUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      isDeleted: true,
    },
  });

  if (existingUser && !existingUser.isDeleted) {
    throw new AppError(
      status.CONFLICT,
      "A user already exists with this email",
    );
  }

  if (existingUser?.isDeleted) {
    throw new AppError(
      status.CONFLICT,
      "This email belongs to a deleted account. Please contact support",
    );
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: payload.name.trim(),
        email,
        password: payload.password,
        role: USER_ROLE.PATIENT,
        phone: payload.phone,
        status: USER_STATUS.ACTIVE,
        isActive: true,
        isDeleted: false,
      },
    });
  } catch (error) {
    return throwBetterAuthError(error);
  }

  const user = await getUserByEmailOrThrow(email);

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
  };
};

const login = async (
  payload: ILoginPayload,
  req: Request,
): Promise<ILoginServiceResult> => {
  const email = normalizeEmail(payload.email);

  await ensureUserCanLogin(email);

  try {
    const { headers, response } = await auth.api.signInEmail({
      body: {
        email,
        password: payload.password,
      },
      headers: buildAuthHeaders(req),
      returnHeaders: true,
    });

    const user = await getUserByEmailOrThrow(email);

    return {
      authHeaders: headers,
      data: {
        user,
        session: response,
      },
    };
  } catch (error) {
    return throwBetterAuthError(error);
  }
};

const logout = async (req: Request) => {
  try {
    const result = await auth.api.signOut({
      headers: buildAuthHeaders(req),
    });

    return result ?? { message: "Logged out successfully" };
  } catch (error) {
    return throwBetterAuthError(error);
  }
};

const getMe = async (req: Request) => {
  try {
    const session = await auth.api.getSession({
      headers: buildAuthHeaders(req),
    });

    if (!session?.user?.id) {
      throw new AppError(status.UNAUTHORIZED, "You are not authenticated");
    }

    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        isDeleted: false,
      },
      select: authUserSelect,
    });

    if (!user) {
      throw new AppError(status.UNAUTHORIZED, "User account not found");
    }

    if (!user.isActive || user.status !== USER_STATUS.ACTIVE) {
      throw new AppError(status.FORBIDDEN, "This account is not active");
    }

    return {
      user,
      session: session.session,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    return throwBetterAuthError(error);
  }
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
  await getUserByEmailOrThrow(payload.email);

  try {
    return await auth.api.requestPasswordResetEmailOTP({
      body: {
        email: normalizeEmail(payload.email),
      },
    });
  } catch (error) {
    return throwBetterAuthError(error);
  }
};

const resetPassword = async (payload: IResetPasswordPayload) => {
  try {
    return await auth.api.resetPasswordEmailOTP({
      body: {
        email: normalizeEmail(payload.email),
        otp: payload.otp,
        password: payload.password,
      },
    });
  } catch (error) {
    return throwBetterAuthError(error);
  }
};

const changePassword = async (
  payload: IChangePasswordPayload,
  req: Request,
) => {
  try {
    return await auth.api.changePassword({
      body: {
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
        revokeOtherSessions: payload.revokeOtherSessions ?? true,
      },
      headers: buildAuthHeaders(req),
    });
  } catch (error) {
    return throwBetterAuthError(error);
  }
};

const verifyEmail = async (payload: IVerifyEmailPayload) => {
  try {
    const result = await auth.api.verifyEmailOTP({
      body: {
        email: normalizeEmail(payload.email),
        otp: payload.otp,
      },
    });

    const user = await getUserByEmailOrThrow(payload.email);

    return {
      ...result,
      user,
    };
  } catch (error) {
    return throwBetterAuthError(error);
  }
};

const resendVerification = async (payload: IResendVerificationPayload) => {
  await getUserByEmailOrThrow(payload.email);

  try {
    return await auth.api.sendVerificationOTP({
      body: {
        email: normalizeEmail(payload.email),
        type: "email-verification",
      },
    });
  } catch (error) {
    return throwBetterAuthError(error);
  }
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
  try {
    return await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL:
          payload.callbackURL ||
          `${normalizeUrl(envVars.FRONTEND_URL)}/auth/google-callback`,
      },
    });
  } catch (error) {
    return throwBetterAuthError(error);
  }
};

const googleLoginSuccess = async (req: Request) => {
  return getMe(req);
};

export const AuthService = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
  googleLogin,
  googleLoginSuccess,
};
