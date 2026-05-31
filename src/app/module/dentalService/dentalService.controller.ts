import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/helpers/catchAsync";
import { sendResponse } from "../../shared/response/sendResponse";
import { IDentalServiceQuery } from "./dentalService.interface";
import { DentalServiceService } from "./dentalService.service";
import { getParamId } from "./dentalService.utils";

const createDentalService = catchAsync(async (req: Request, res: Response) => {
  const result = await DentalServiceService.createDentalService(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Dental service created successfully",
    data: result,
  });
});

const getAllDentalServices = catchAsync(async (req: Request, res: Response) => {
  const result = await DentalServiceService.getAllDentalServices(
    req.query as IDentalServiceQuery,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Dental services fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getActiveDentalServices = catchAsync(
  async (req: Request, res: Response) => {
    const result = await DentalServiceService.getActiveDentalServices(
      req.query as IDentalServiceQuery,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Active dental services fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getDentalServiceById = catchAsync(async (req: Request, res: Response) => {
  const serviceId = getParamId(req.params.id);

  const result = await DentalServiceService.getDentalServiceById(serviceId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Dental service fetched successfully",
    data: result,
  });
});

const getDentalServiceBySlug = catchAsync(
  async (req: Request, res: Response) => {
    const slug = getParamId(req.params.slug);

    const result = await DentalServiceService.getDentalServiceBySlug(slug);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Dental service fetched successfully",
      data: result,
    });
  },
);

const updateDentalService = catchAsync(async (req: Request, res: Response) => {
  const serviceId = getParamId(req.params.id);

  const result = await DentalServiceService.updateDentalService(
    serviceId,
    req.body,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Dental service updated successfully",
    data: result,
  });
});

const updateDentalServiceStatus = catchAsync(
  async (req: Request, res: Response) => {
    const serviceId = getParamId(req.params.id);

    const result = await DentalServiceService.updateDentalServiceStatus(
      serviceId,
      req.body,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Dental service status updated successfully",
      data: result,
    });
  },
);

const deleteDentalService = catchAsync(async (req: Request, res: Response) => {
  const serviceId = getParamId(req.params.id);

  const result = await DentalServiceService.deleteDentalService(serviceId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Dental service deleted successfully",
    data: result,
  });
});

export const DentalServiceController = {
  createDentalService,
  getAllDentalServices,
  getActiveDentalServices,
  getDentalServiceById,
  getDentalServiceBySlug,
  updateDentalService,
  updateDentalServiceStatus,
  deleteDentalService,
};
