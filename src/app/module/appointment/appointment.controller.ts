import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/helpers/catchAsync";
import { sendResponse } from "../../shared/response/sendResponse";
import { IAppointmentQuery } from "./appointment.interface";
import { AppointmentService } from "./appointment.service";
import { getParamId } from "./appointment.utils";

const getAppointments = catchAsync(async (req: Request, res: Response) => {
  const result = await AppointmentService.getAppointments(
    req.query as IAppointmentQuery,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Appointments fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const bookRegularAppointment = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AppointmentService.bookRegularAppointment(
      req.body,
      req.user!,
    );

    sendResponse(res, {
      statusCode: status.CREATED,
      success: true,
      message: "Appointment booked successfully",
      data: result,
    });
  },
);

const bookEmergencyAppointment = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AppointmentService.bookEmergencyAppointment(
      req.body,
      req.user!,
    );

    sendResponse(res, {
      statusCode: status.CREATED,
      success: true,
      message: "Emergency appointment booked successfully",
      data: result,
    });
  },
);

const getAppointmentById = catchAsync(async (req: Request, res: Response) => {
  const appointmentId = getParamId(req.params.id);

  const result = await AppointmentService.getAppointmentById(
    appointmentId,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Appointment details fetched successfully",
    data: result,
  });
});

const updateAppointment = catchAsync(async (req: Request, res: Response) => {
  const appointmentId = getParamId(req.params.id);

  const result = await AppointmentService.updateAppointment(
    appointmentId,
    req.body,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Appointment updated successfully",
    data: result,
  });
});

const deleteAppointment = catchAsync(async (req: Request, res: Response) => {
  const appointmentId = getParamId(req.params.id);

  const result = await AppointmentService.deleteAppointment(
    appointmentId,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Appointment cancelled successfully",
    data: result,
  });
});

export const AppointmentController = {
  getAppointments,
  bookRegularAppointment,
  bookEmergencyAppointment,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
};
