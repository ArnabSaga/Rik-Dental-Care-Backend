import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateRequest({ body: AuthValidation.register }),
  AuthController.register,
);

router.post(
  "/login",
  validateRequest({ body: AuthValidation.login }),
  AuthController.login,
);

router.post("/logout", AuthController.logout);

router.get("/me", AuthController.getMe);

router.post(
  "/forgot-password",
  validateRequest({ body: AuthValidation.forgotPassword }),
  AuthController.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequest({ body: AuthValidation.resetPassword }),
  AuthController.resetPassword,
);

router.post(
  "/change-password",
  validateRequest({ body: AuthValidation.changePassword }),
  AuthController.changePassword,
);

router.post(
  "/verify-email",
  validateRequest({ body: AuthValidation.verifyEmail }),
  AuthController.verifyEmail,
);

router.post(
  "/resend-verification",
  validateRequest({ body: AuthValidation.resendVerification }),
  AuthController.resendVerification,
);

router.post(
  "/google",
  validateRequest({ body: AuthValidation.googleLogin }),
  AuthController.googleLogin,
);

router.get("/google/success", AuthController.googleLoginSuccess);

export const AuthRoutes = router;
