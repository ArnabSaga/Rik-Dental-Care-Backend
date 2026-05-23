import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";

export const APPOINTMENT_ROLE = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  MANAGER: "MANAGER",
} as const;

export const APPOINTMENT_TYPE = {
  REGULAR: "REGULAR",
  EMERGENCY: "EMERGENCY",
} as const;

export const APPOINTMENT_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  RESCHEDULED: "RESCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;

export const APPOINTMENT_PRIORITY = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export const DEFAULT_APPOINTMENT_SLOT_MINUTES = 30;

export const appointmentSearchableFields = [
  "appointmentNo",
  "chiefComplaint",
  "symptoms",
  "emergencyNote",
  "cancelReason",
];

export const appointmentFilterableFields = [
  "patientId",
  "treatedById",
  "createdById",
  "type",
  "status",
  "priority",
];

export const appointmentSortableFields = [
  "appointmentNo",
  "scheduledAt",
  "createdAt",
  "updatedAt",
  "status",
  "priority",
  "type",
];

export const appointmentSelectableFields = [
  "id",
  "appointmentNo",
  "patientId",
  "treatedById",
  "createdById",
  "scheduledAt",
  "startedAt",
  "completedAt",
  "cancelledAt",
  "type",
  "status",
  "priority",
  "chiefComplaint",
  "symptoms",
  "emergencyNote",
  "cancelReason",
  "rescheduledFromId",
  "createdAt",
  "updatedAt",
];

export const appointmentInclude = {
  patient: {
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
  treatedBy: {
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
  createdBy: {
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
  appointmentServices: {
    include: {
      service: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          isActive: true,
        },
      },
    },
  },
};

export const getParamId = (id: string | string[] | undefined): string => {
  if (!id || Array.isArray(id)) {
    throw new AppError(status.BAD_REQUEST, "Valid appointment id is required");
  }

  return id;
};

export const normalizeDateTime = (value: string | Date): Date => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(status.BAD_REQUEST, "Invalid appointment date/time");
  }

  return date;
};

export const ensureFutureDate = (
  date: Date,
  message = "Appointment time must be in the future"
) => {
  if (date <= new Date()) {
    throw new AppError(status.BAD_REQUEST, message);
  }
};

export const removeUndefinedFields = <T extends Record<string, unknown>>(
  payload: T
): Partial<T> => {
  const cleanPayload: Partial<T> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanPayload[key as keyof T] = value as T[keyof T];
    }
  });

  return cleanPayload;
};

export const generateAppointmentNo = async (): Promise<string> => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const prefix = `APT-${year}${month}${day}`;

  const count = await prisma.appointment.count({
    where: {
      appointmentNo: {
        startsWith: prefix,
      },
    },
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
};

export const getSlotRange = (scheduledAt: Date) => {
  const start = new Date(scheduledAt.getTime() - DEFAULT_APPOINTMENT_SLOT_MINUTES * 60 * 1000);
  const end = new Date(scheduledAt.getTime() + DEFAULT_APPOINTMENT_SLOT_MINUTES * 60 * 1000);

  return {
    start,
    end,
  };
};

export const getAppointmentDateRangeWhere = (query: {
  scheduledAtFrom?: string;
  scheduledAtTo?: string;
}): Prisma.AppointmentWhereInput => {
  const scheduledAt: Prisma.DateTimeFilter = {};

  if (query.scheduledAtFrom) {
    const fromDate = normalizeDateTime(query.scheduledAtFrom);
    scheduledAt.gte = fromDate;
  }

  if (query.scheduledAtTo) {
    const toDate = normalizeDateTime(query.scheduledAtTo);
    scheduledAt.lte = toDate;
  }

  if (Object.keys(scheduledAt).length === 0) {
    return {};
  }

  return {
    scheduledAt,
  };
};
