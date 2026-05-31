import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/helpers/catchAsync";
import { sendResponse } from "../../shared/response/sendResponse";
import { IPatientProfileQuery } from "./profile.interface";
import { ProfileService } from "./profile.service";
import { getParamId } from "./profile.utils";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await ProfileService.getMyProfile(req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Profile fetched successfully",
    data: result,
  });
});

const upsertMyPatientProfile = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ProfileService.upsertMyPatientProfile(
      req.user!.id,
      req.body,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Patient profile saved successfully",
      data: result,
    });
  },
);

const upsertMyDoctorProfile = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ProfileService.upsertMyDoctorProfile(
      req.user!.id,
      req.body,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Doctor profile saved successfully",
      data: result,
    });
  },
);

const upsertMyManagerProfile = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ProfileService.upsertMyManagerProfile(
      req.user!.id,
      req.body,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Manager profile saved successfully",
      data: result,
    });
  },
);

const getAllPatientProfiles = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ProfileService.getAllPatientProfiles(
      req.query as IPatientProfileQuery,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Patient profiles fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getPatientProfileById = catchAsync(
  async (req: Request, res: Response) => {
    const profileId = getParamId(req.params.id);

    const result = await ProfileService.getPatientProfileById(profileId);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Patient profile fetched successfully",
      data: result,
    });
  },
);

const getPatientProfileByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const userId = getParamId(req.params.userId);

    const result = await ProfileService.getPatientProfileByUserId(userId);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Patient profile fetched successfully",
      data: result,
    });
  },
);

export const ProfileController = {
  getMyProfile,
  upsertMyPatientProfile,
  upsertMyDoctorProfile,
  upsertMyManagerProfile,
  getAllPatientProfiles,
  getPatientProfileById,
  getPatientProfileByUserId,
};
