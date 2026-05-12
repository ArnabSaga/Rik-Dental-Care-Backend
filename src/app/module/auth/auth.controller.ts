import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/helpers/catchAsync";
import { sendResponse } from "../../shared/response/sendResponse";
import { AuthService } from "./auth.service";
import { forwardAuthCookies } from "./auth.utils";

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "User registered successfully. Please verify your email.",
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body, req);

  forwardAuthCookies(result.authHeaders, res);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User logged in successfully",
    data: result.data,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.logout(req);

  res.clearCookie("rik_dental_care_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User logged out successfully",
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getMe(req);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Current user fetched successfully",
    data: result,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password reset OTP sent successfully",
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.resetPassword(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.changePassword(req.body, req);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyEmail(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Email verified successfully",
    data: result,
  });
});

const resendVerification = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.resendVerification(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Verification OTP sent successfully",
    data: result,
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.googleLogin(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Google login URL generated successfully",
    data: result,
  });
});

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.googleLoginSuccess(req);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Google login successful",
    data: result,
  });
});

export const AuthController = {
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
