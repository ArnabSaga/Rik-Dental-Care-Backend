import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/helpers/catchAsync";
import { sendResponse } from "../../shared/response/sendResponse";
import { IAdminAppointmentQuery, IAdminUserQuery } from "./admin.interface";
import { AdminService } from "./admin.service";
import { getParamId } from "./admin.utils";

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminService.getDashboardStats();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin dashboard stats fetched successfully",
    data: result,
  });
});

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getUsers(req.query as IAdminUserQuery);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Users fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getAppointments = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAppointments(
    req.query as IAdminAppointmentQuery,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Appointments fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getAppointmentById = catchAsync(async (req: Request, res: Response) => {
  const appointmentId = getParamId(req.params.id);

  const result = await AdminService.getAppointmentById(appointmentId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Appointment fetched successfully",
    data: result,
  });
});

const createAppointment = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.createAppointment(req.body, req.user!);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Appointment created successfully by admin",
    data: result,
  });
});

export const AdminController = {
  getDashboardStats,
  getUsers,
  getAppointments,
  getAppointmentById,
  createAppointment,
};
