import { NextFunction, Request, RequestHandler, Response } from "express";
import status from "http-status";
import AppError from "../shared/errors/AppError";

export type TAllowedRole = "ADMIN" | "PATIENT" | "MANAGER";

export const validateRole =
  (...allowedRoles: TAllowedRole[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(status.UNAUTHORIZED, "You are not authenticated");
      }

      if (!allowedRoles.includes(req.user.role as TAllowedRole)) {
        throw new AppError(
          status.FORBIDDEN,
          "You are not allowed to access this resource",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

// Optional alias if you used roleMiddleware somewhere else
export const roleMiddleware = validateRole;
