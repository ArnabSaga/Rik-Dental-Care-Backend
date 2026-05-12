import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters");

const register = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must not exceed 100 characters"),

  email: z.string().trim().toLowerCase().email("Invalid email address"),

  password: passwordSchema,

  role: z.enum(["PATIENT", "MANAGER", "ADMIN"]).optional().default("PATIENT"),

  phone: z.string().trim().min(5).max(20).optional(),
});

const login = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotPassword = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

const verifyEmail = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

const resendVerification = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

const resetPassword = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
  password: passwordSchema,
});

const changePassword = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  revokeOtherSessions: z.boolean().optional().default(true),
});

const googleLogin = z.object({
  callbackURL: z.string().url("Invalid callback URL").optional(),
});

export const AuthValidation = {
  register,
  login,
  forgotPassword,
  verifyEmail,
  resendVerification,
  resetPassword,
  changePassword,
  googleLogin,
};
