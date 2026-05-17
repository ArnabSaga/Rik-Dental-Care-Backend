import { NextFunction, Request, RequestHandler, Response } from "express";
import status from "http-status";
import { User } from "../../../generated/prisma/client";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";
import { buildAuthHeaders } from "../auth/auth.utils";

export const USER_ROLE = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  MANAGER: "MANAGER",
} as const;

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
} as const;

export const userSearchableFields = ["name", "email", "phone"];

export const userFilterableFields = ["role", "status", "isActive", "emailVerified"];

export const userSortableFields = ["name", "email", "role", "status", "createdAt", "updatedAt"];

export const userSelectableFields = [
  "id",
  "name",
  "email",
  "emailVerified",
  "role",
  "status",
  "image",
  "phone",
  "isActive",
  "createdAt",
  "updatedAt",
];

export const getUserSelect = () => ({
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  role: true,
  status: true,
  image: true,
  phone: true,
  isActive: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
});

export const getPublicUserSelect = () => ({
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  role: true,
  status: true,
  image: true,
  phone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const getParamId = (id: string | string[] | undefined): string => {
  if (!id || Array.isArray(id)) {
    throw new AppError(status.BAD_REQUEST, "Valid user id is required");
  }

  return id;
};

export const getAuthenticatedUser = async (req: Request): Promise<User> => {
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
  });

  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "Authenticated user not found");
  }

  if (!user.isActive || user.status !== USER_STATUS.ACTIVE) {
    throw new AppError(status.FORBIDDEN, "This account is not active");
  }

  return user;
};

export const requireAuth: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    req.user = await getAuthenticatedUser(req);
    next();
  } catch (error) {
    next(error);
  }
};

export const removeUndefinedFields = <T extends Record<string, unknown>>(
  payload: T
): Partial<T> => {
  const cleanPayload: Partial<T> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanPayload[key as keyof T] = value as T[keyof T];
    }
  });

  return cleanPayload;
};
