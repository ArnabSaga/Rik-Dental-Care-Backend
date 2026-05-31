import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import { TErrorResponse, TErrorSources } from "../types/error.types";

const getStatusCodeFromPrismaError = (errorCode: string): number => {
  //! Unique constraint failed
  if (errorCode === "P2002") {
    return status.CONFLICT;
  }

  //! Not found related errors
  if (["P2001", "P2025", "P2015", "P2018"].includes(errorCode)) {
    return status.NOT_FOUND;
  }

  //! DB authentication errors
  if (["P1000", "P6002"].includes(errorCode)) {
    return status.UNAUTHORIZED;
  }

  //! Access denied errors
  if (["P1010", "P6010"].includes(errorCode)) {
    return status.FORBIDDEN;
  }

  //! Billing / plan related
  if (errorCode === "P6003") {
    return status.PAYMENT_REQUIRED;
  }

  //! Timeout / upstream DB issues
  if (["P1008", "P2004", "P6004"].includes(errorCode)) {
    return status.GATEWAY_TIMEOUT;
  }

  //! Rate limit exceeded
  if (errorCode === "P5011") {
    return status.TOO_MANY_REQUESTS;
  }

  //! Payload too large
  if (errorCode === "P6009") {
    return status.REQUEST_ENTITY_TOO_LARGE;
  }

  //! Connection / infrastructure errors
  if (
    errorCode.startsWith("P1") ||
    ["P2024", "P2037", "P6008"].includes(errorCode)
  ) {
    return status.SERVICE_UNAVAILABLE;
  }

  // Query / request related errors
  if (errorCode.startsWith("P2")) {
    return status.BAD_REQUEST;
  }

  // Migration / internal Prisma engine errors
  if (errorCode.startsWith("P3") || errorCode.startsWith("P4")) {
    return status.INTERNAL_SERVER_ERROR;
  }

  return status.INTERNAL_SERVER_ERROR;
};

const cleanPrismaMessage = (message: string): string => {
  return message.replace(/Invalid `.*?` invocation:?\s*/i, "").trim();
};

const getMainMessage = (message: string, fallback: string): string => {
  const lines = cleanPrismaMessage(message)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines[0] || fallback;
};

const formatErrorMeta = (meta?: Record<string, unknown>): string => {
  if (!meta) return "";

  const parts: string[] = [];

  if (meta.target) {
    const target = Array.isArray(meta.target)
      ? meta.target.join(", ")
      : String(meta.target);
    parts.push(`Field(s): ${target}`);
  }

  if (meta.field_name) {
    parts.push(`Field: ${String(meta.field_name)}`);
  }

  if (meta.column_name) {
    parts.push(`Column: ${String(meta.column_name)}`);
  }

  if (meta.table) {
    parts.push(`Table: ${String(meta.table)}`);
  }

  if (meta.model_name) {
    parts.push(`Model: ${String(meta.model_name)}`);
  }

  if (meta.relation_name) {
    parts.push(`Relation: ${String(meta.relation_name)}`);
  }

  if (meta.constraint) {
    parts.push(`Constraint: ${String(meta.constraint)}`);
  }

  if (meta.database_error) {
    parts.push(`Database Error: ${String(meta.database_error)}`);
  }

  return parts.length > 0 ? parts.join(" | ") : "";
};

export const handlePrismaClientKnownRequestError = (
  error: Prisma.PrismaClientKnownRequestError,
): TErrorResponse => {
  const statusCode = getStatusCodeFromPrismaError(error.code);
  const mainMessage = getMainMessage(
    error.message,
    "An error occurred with the database operation.",
  );
  const metaInfo = formatErrorMeta(
    error.meta as Record<string, unknown> | undefined,
  );

  const errorSources: TErrorSources[] = [
    {
      path: error.code,
      message: metaInfo ? `${mainMessage} | ${metaInfo}` : mainMessage,
    },
  ];

  if (error.meta?.cause) {
    errorSources.push({
      path: "cause",
      message: String(error.meta.cause),
    });
  }

  return {
    success: false,
    statusCode,
    message: mainMessage,
    errorSources,
  };
};

export const handlePrismaClientUnknownError = (
  error: Prisma.PrismaClientUnknownRequestError,
): TErrorResponse => {
  const mainMessage = getMainMessage(
    error.message,
    "An unknown error occurred with the database operation.",
  );

  const errorSources: TErrorSources[] = [
    {
      path: "unknown",
      message: mainMessage,
    },
  ];

  return {
    success: false,
    statusCode: status.INTERNAL_SERVER_ERROR,
    message: mainMessage,
    errorSources,
  };
};

export const handlePrismaClientValidationError = (
  error: Prisma.PrismaClientValidationError,
): TErrorResponse => {
  const cleanMessage = cleanPrismaMessage(error.message);

  const lines = cleanMessage
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const fieldMatch = cleanMessage.match(/Argument `([^`]+)`/i);
  const fieldName = fieldMatch ? fieldMatch[1] : "unknown";

  const mainMessage =
    lines.find(
      (line) =>
        !line.includes("Argument") && !line.includes("→") && line.length > 10,
    ) ||
    lines[0] ||
    "Invalid query parameters provided to the database operation.";

  const errorSources: TErrorSources[] = [
    {
      path: fieldName,
      message: mainMessage,
    },
  ];

  return {
    success: false,
    statusCode: status.BAD_REQUEST,
    message: mainMessage,
    errorSources,
  };
};

export const handlePrismaClientInitializationError = (
  error: Prisma.PrismaClientInitializationError,
): TErrorResponse => {
  const statusCode = error.errorCode
    ? getStatusCodeFromPrismaError(error.errorCode)
    : status.SERVICE_UNAVAILABLE;

  const mainMessage = getMainMessage(
    error.message,
    "An error occurred while initializing the Prisma Client.",
  );

  const errorSources: TErrorSources[] = [
    {
      path: error.errorCode || "initialization",
      message: mainMessage,
    },
  ];

  return {
    success: false,
    statusCode,
    message: mainMessage,
    errorSources,
  };
};

export const handlePrismaClientRustPanicError = (): TErrorResponse => {
  const message =
    "The database engine encountered a fatal error and crashed. Please check the logs for more details.";

  const errorSources: TErrorSources[] = [
    {
      path: "rust-engine",
      message,
    },
  ];

  return {
    success: false,
    statusCode: status.INTERNAL_SERVER_ERROR,
    message,
    errorSources,
  };
};
