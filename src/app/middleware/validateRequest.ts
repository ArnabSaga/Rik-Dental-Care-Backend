import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validateRequest =
  (options: {
    body?: z.ZodTypeAny;
    query?: z.ZodTypeAny;
    params?: z.ZodTypeAny;
    cookies?: z.ZodTypeAny;
  }) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (options.body) {
        req.body = await options.body.parseAsync(req.body);
      }

      if (options.query) {
        req.query = (await options.query.parseAsync(req.query)) as Request["query"];
      }

      if (options.params) {
        req.params = (await options.params.parseAsync(
          req.params
        )) as Request["params"];
      }

      if (options.cookies) {
        req.cookies = (await options.cookies.parseAsync(req.cookies)) as any;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
