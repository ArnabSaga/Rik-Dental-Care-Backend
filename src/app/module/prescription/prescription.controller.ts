import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/helpers/catchAsync";
import { sendResponse } from "../../shared/response/sendResponse";
import { IPrescriptionQuery } from "./prescription.interface";
import { PrescriptionService } from "./prescription.service";
import { getParamId } from "./prescription.utils";

const getPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await PrescriptionService.getPrescriptions(
    req.query as IPrescriptionQuery,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Prescriptions fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const createPrescription = catchAsync(async (req: Request, res: Response) => {
  const result = await PrescriptionService.createPrescription(
    req.body,
    req.user!,
    req.file,
  );

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Prescription created successfully",
    data: result,
  });
});

const getPrescriptionById = catchAsync(async (req: Request, res: Response) => {
  const prescriptionId = getParamId(req.params.id);

  const result = await PrescriptionService.getPrescriptionById(
    prescriptionId,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Prescription fetched successfully",
    data: result,
  });
});

const getPrescriptionByAppointmentId = catchAsync(
  async (req: Request, res: Response) => {
    const appointmentId = getParamId(req.params.appointmentId);

    const result = await PrescriptionService.getPrescriptionByAppointmentId(
      appointmentId,
      req.user!,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Prescription fetched successfully",
      data: result,
    });
  },
);

const updatePrescription = catchAsync(async (req: Request, res: Response) => {
  const prescriptionId = getParamId(req.params.id);

  const result = await PrescriptionService.updatePrescription(
    prescriptionId,
    req.body,
    req.user!,
    req.file,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Prescription updated successfully",
    data: result,
  });
});

const deletePrescription = catchAsync(async (req: Request, res: Response) => {
  const prescriptionId = getParamId(req.params.id);

  const result = await PrescriptionService.deletePrescription(
    prescriptionId,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Prescription deleted successfully",
    data: result,
  });
});

export const PrescriptionController = {
  getPrescriptions,
  createPrescription,
  getPrescriptionById,
  getPrescriptionByAppointmentId,
  updatePrescription,
  deletePrescription,
};
