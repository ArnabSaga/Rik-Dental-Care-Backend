import { Request, Response } from "express";
import status from "http-status";
import { isAPIError } from "better-auth/api";
import AppError from "../../shared/errors/AppError";

type HeadersWithGetSetCookie = Headers & {
  getSetCookie?: () => string[];
};

type BetterAuthErrorShape = Error & {
  statusCode?: number;
  status?: number;
  body?: {
    message?: string;
  };
};

export const buildAuthHeaders = (req: Request): Headers => {
  const headers = new Headers();

  const forwardedHeaders = [
    "authorization",
    "cookie",
    "user-agent",
    "x-forwarded-for",
    "x-forwarded-host",
    "x-forwarded-proto",
    "accept-language",
  ];

  forwardedHeaders.forEach((headerName) => {
    const value = req.headers[headerName];

    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(headerName, item));
      return;
    }

    if (value) {
      headers.set(headerName, value);
    }
  });

  return headers;
};

export const forwardAuthCookies = (
  authHeadersOrResponse: Headers | globalThis.Response,
  res: Response,
): void => {
  const headers =
    authHeadersOrResponse instanceof Headers
      ? (authHeadersOrResponse as HeadersWithGetSetCookie)
      : (authHeadersOrResponse.headers as HeadersWithGetSetCookie);

  if (typeof headers.getSetCookie === "function") {
    const cookies = headers.getSetCookie();

    if (cookies.length > 0) {
      res.setHeader("Set-Cookie", cookies);
    }

    return;
  }

  const singleCookie = headers.get("set-cookie");

  if (singleCookie) {
    res.append("Set-Cookie", singleCookie);
  }
};

export const throwBetterAuthError = (error: unknown): never => {
  if (isAPIError(error)) {
    const apiError = error as BetterAuthErrorShape;

    const statusCode =
      apiError.statusCode || apiError.status || status.BAD_REQUEST;

    const message =
      apiError.body?.message ||
      apiError.message ||
      "Authentication request failed";

    throw new AppError(Number(statusCode), message);
  }

  if (error instanceof AppError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new AppError(status.BAD_REQUEST, error.message);
  }

  throw new AppError(status.BAD_REQUEST, "Authentication request failed");
};
