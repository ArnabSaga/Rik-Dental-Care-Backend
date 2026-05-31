import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";
import { QueryBuilder } from "../../shared/helpers/queryHelper";
import {
  IAdminUpdateUserPayload,
  IUpdateMePayload,
  IUserListQuery,
} from "./user.interface";
import {
  getPublicUserSelect,
  getUserSelect,
  removeUndefinedFields,
  USER_STATUS,
  userFilterableFields,
  userSearchableFields,
  userSelectableFields,
  userSortableFields,
} from "./user.utils";

const ensureUserExists = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: getUserSelect(),
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return user;
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isDeleted: false,
    },
    select: getPublicUserSelect(),
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User profile not found");
  }

  return user;
};

const updateMe = async (userId: string, payload: IUpdateMePayload) => {
  await ensureUserExists(userId);

  const cleanPayload = removeUndefinedFields({
    name: payload.name,
    phone: payload.phone,
    image: payload.image,
  });

  if (Object.keys(cleanPayload).length === 0) {
    throw new AppError(status.BAD_REQUEST, "No valid update data provided");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: cleanPayload,
    select: getPublicUserSelect(),
  });

  return updatedUser;
};

const getAllUsers = async (query: IUserListQuery) => {
  const queryBuilder = new QueryBuilder(prisma.user, query, {
    searchableFields: userSearchableFields,
    filterableFields: userFilterableFields,
    sortableFields: userSortableFields,
    selectableFields: userSelectableFields,
    booleanFields: ["isActive", "emailVerified"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultLimit: 10,
    maxLimit: 100,
  });

  const result = await queryBuilder
    .where({
      isDeleted: false,
    })
    .search()
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();

  return result;
};

const getUserById = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: getPublicUserSelect(),
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return user;
};

const normalizeAdminUpdatePayload = (
  payload: IAdminUpdateUserPayload,
): Partial<IAdminUpdateUserPayload> => {
  const cleanPayload = removeUndefinedFields({
    name: payload.name,
    phone: payload.phone,
    image: payload.image,
    role: payload.role,
    status: payload.status,
    isActive: payload.isActive,
    emailVerified: payload.emailVerified,
  });

  if (cleanPayload.status === USER_STATUS.ACTIVE) {
    cleanPayload.isActive = true;
  }

  if (
    cleanPayload.status === USER_STATUS.INACTIVE ||
    cleanPayload.status === USER_STATUS.BLOCKED
  ) {
    cleanPayload.isActive = false;
  }

  if (cleanPayload.isActive === true && !cleanPayload.status) {
    cleanPayload.status = USER_STATUS.ACTIVE;
  }

  if (cleanPayload.isActive === false && !cleanPayload.status) {
    cleanPayload.status = USER_STATUS.INACTIVE;
  }

  return cleanPayload;
};

const updateUserByAdmin = async (
  id: string,
  payload: IAdminUpdateUserPayload,
  adminUserId: string,
) => {
  await ensureUserExists(id);

  const cleanPayload = normalizeAdminUpdatePayload(payload);

  if (Object.keys(cleanPayload).length === 0) {
    throw new AppError(status.BAD_REQUEST, "No valid update data provided");
  }

  if (
    id === adminUserId &&
    cleanPayload.status &&
    cleanPayload.status !== USER_STATUS.ACTIVE
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "Admin cannot deactivate own account",
    );
  }

  if (id === adminUserId && cleanPayload.isActive === false) {
    throw new AppError(
      status.BAD_REQUEST,
      "Admin cannot deactivate own account",
    );
  }

  const updatedUser = await prisma.user.update({
    where: {
      id,
    },
    data: cleanPayload as Prisma.UserUpdateInput,
    select: getPublicUserSelect(),
  });

  return updatedUser;
};

const deleteUserByAdmin = async (id: string, adminUserId: string) => {
  await ensureUserExists(id);

  if (id === adminUserId) {
    throw new AppError(status.BAD_REQUEST, "Admin cannot delete own account");
  }

  await prisma.user.update({
    where: {
      id,
    },
    data: {
      isDeleted: true,
      isActive: false,
      status: USER_STATUS.INACTIVE,
      deletedAt: new Date(),
    },
  });

  return {
    id,
    message: "User deleted successfully",
  };
};

export const UserService = {
  getMe,
  updateMe,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deleteUserByAdmin,
};
