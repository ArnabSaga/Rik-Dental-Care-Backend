import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import AppError from "../../shared/errors/AppError";

export const NOTIFICATION_ROLE = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  MANAGER: "MANAGER",
} as const;

export const NOTIFICATION_TYPE = {
  APPOINTMENT: "APPOINTMENT",
  EMERGENCY: "EMERGENCY",
  REMINDER: "REMINDER",
  PRESCRIPTION: "PRESCRIPTION",
  INVOICE: "INVOICE",
  SYSTEM: "SYSTEM",
} as const;

export const NOTIFICATION_ENTITY_TYPE = {
  APPOINTMENT: "APPOINTMENT",
  INVOICE: "INVOICE",
  PRESCRIPTION: "PRESCRIPTION",
  MEDICAL_HISTORY: "MEDICAL_HISTORY",
  CLINICAL_NOTE: "CLINICAL_NOTE",
  TREATMENT_PLAN: "TREATMENT_PLAN",
  PAYMENT: "PAYMENT",
} as const;

export const notificationSearchableFields = ["title", "message"];

export const notificationFilterableFields = [
  "recipientId",
  "type",
  "entityType",
  "entityId",
  "isRead",
];

export const notificationSortableFields = [
  "createdAt",
  "updatedAt",
  "readAt",
  "type",
  "isRead",
];

export const notificationSelectableFields = [
  "id",
  "recipientId",
  "title",
  "message",
  "type",
  "isRead",
  "readAt",
  "entityType",
  "entityId",
  "createdAt",
  "updatedAt",
];

export const notificationInclude = {
  recipient: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      status: true,
      isActive: true,
    },
  },
};

export const getParamId = (id: string | string[] | undefined): string => {
  if (!id || Array.isArray(id)) {
    throw new AppError(status.BAD_REQUEST, "Valid notification id is required");
  }

  return id;
};

export const normalizeDate = (value: string): Date => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(status.BAD_REQUEST, "Invalid date");
  }

  return date;
};

export const getNotificationDateRangeWhere = (query: {
  createdAtFrom?: string;
  createdAtTo?: string;
}): Prisma.NotificationWhereInput => {
  const createdAt: Prisma.DateTimeFilter = {};

  if (query.createdAtFrom) {
    createdAt.gte = normalizeDate(query.createdAtFrom);
  }

  if (query.createdAtTo) {
    createdAt.lte = normalizeDate(query.createdAtTo);
  }

  if (Object.keys(createdAt).length === 0) {
    return {};
  }

  return {
    createdAt,
  };
};

export const removeUndefinedFields = <T extends Record<string, unknown>>(
  payload: T,
): Partial<T> => {
  const cleanPayload: Partial<T> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanPayload[key as keyof T] = value as T[keyof T];
    }
  });

  return cleanPayload;
};
