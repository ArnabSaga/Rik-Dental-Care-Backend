import { Response } from "express";
import { TResponse } from "../types/global.types";

export const sendResponse = <T>(res: Response, responseData: TResponse<T>) => {
  const { statusCode, success, message, data, meta, stats } = responseData;

  return res.status(statusCode).json({
    success,
    message,
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
    ...(stats !== undefined && { stats }),
  });
};
