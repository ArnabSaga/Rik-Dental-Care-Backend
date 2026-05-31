import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/helpers/catchAsync";
import { sendResponse } from "../../shared/response/sendResponse";
import { IMedicalHistoryQuery } from "./medicalHistory.interface";
import { MedicalHistoryService } from "./medicalHistory.service";
import { getParamId } from "./medicalHistory.utils";

const getMedicalHistories = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalHistoryService.getMedicalHistories(
    req.query as IMedicalHistoryQuery,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Medical histories fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const createMedicalHistory = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalHistoryService.createMedicalHistory(
    req.body,
    req.user!,
    req.file,
  );

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Medical history created successfully",
    data: result,
  });
});

const getMedicalHistoryById = catchAsync(
  async (req: Request, res: Response) => {
    const medicalHistoryId = getParamId(req.params.id);

    const result = await MedicalHistoryService.getMedicalHistoryById(
      medicalHistoryId,
      req.user!,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Medical history fetched successfully",
      data: result,
    });
  },
);

const updateMedicalHistory = catchAsync(async (req: Request, res: Response) => {
  const medicalHistoryId = getParamId(req.params.id);

  const result = await MedicalHistoryService.updateMedicalHistory(
    medicalHistoryId,
    req.body,
    req.user!,
    req.file,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Medical history updated successfully",
    data: result,
  });
});

const deleteMedicalHistory = catchAsync(async (req: Request, res: Response) => {
  const medicalHistoryId = getParamId(req.params.id);

  const result = await MedicalHistoryService.deleteMedicalHistory(
    medicalHistoryId,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Medical history deleted successfully",
    data: result,
  });
});

export const MedicalHistoryController = {
  getMedicalHistories,
  createMedicalHistory,
  getMedicalHistoryById,
  updateMedicalHistory,
  deleteMedicalHistory,
};
