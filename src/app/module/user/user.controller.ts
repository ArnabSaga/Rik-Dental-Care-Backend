import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/helpers/catchAsync";
import { sendResponse } from "../../shared/response/sendResponse";
import { IUserListQuery } from "./user.interface";
import { UserService } from "./user.service";
import { getParamId } from "./user.utils";

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getMe(req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User profile fetched successfully",
    data: result,
  });
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateMe(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User profile updated successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query as IUserListQuery);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Users fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const userId = getParamId(req.params.id);

  const result = await UserService.getUserById(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

const updateUserByAdmin = catchAsync(async (req: Request, res: Response) => {
  const userId = getParamId(req.params.id);

  const result = await UserService.updateUserByAdmin(userId, req.body, req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User updated successfully by admin",
    data: result,
  });
});

const deleteUserByAdmin = catchAsync(async (req: Request, res: Response) => {
  const userId = getParamId(req.params.id);

  const result = await UserService.deleteUserByAdmin(userId, req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User deleted successfully by admin",
    data: result,
  });
});

export const UserController = {
  getMe,
  updateMe,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deleteUserByAdmin,
};
