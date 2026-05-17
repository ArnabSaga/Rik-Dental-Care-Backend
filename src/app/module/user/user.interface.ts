import { User } from "../../../generated/prisma/client";
import { IQueryParams } from "../../shared/types/query.types";

export type TUserRole = "ADMIN" | "PATIENT" | "MANAGER";
export type TUserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export type TSafeUser = Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "emailVerified"
  | "role"
  | "status"
  | "image"
  | "phone"
  | "isActive"
  | "isDeleted"
  | "createdAt"
  | "updatedAt"
>;

export interface IUpdateMePayload {
  name?: string;
  phone?: string | null;
  image?: string | null;
}

export interface IAdminUpdateUserPayload {
  name?: string;
  phone?: string | null;
  image?: string | null;
  role?: TUserRole;
  status?: TUserStatus;
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface IUserListQuery extends IQueryParams {
  searchTerm?: string;
  role?: TUserRole;
  status?: TUserStatus;
  isActive?: string | boolean;
  emailVerified?: string | boolean;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  fields?: string;
}
