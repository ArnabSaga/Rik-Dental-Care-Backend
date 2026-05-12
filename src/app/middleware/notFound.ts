import { Request, Response } from "express";
import httpStatus from "http-status";

const notFound = (req: Request, res: Response) => {
  return res.status(httpStatus.NOT_FOUND).json({
    success: false,
    statusCode: httpStatus.NOT_FOUND,
    message: "API Not Found",
    errorSources: [
      {
        path: req.originalUrl,
        message: "Your requested route does not exist.",
      },
    ],
  });
};

export default notFound;
