import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";

export const ADMIN_ROLE = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  MANAGER: "MANAGER",
} as const;

export const ADMIN_APPOINTMENT_TYPE = {
  REGULAR: "REGULAR",
  EMERGENCY: "EMERGENCY",
} as const;

export const ADMIN_APPOINTMENT_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  RESCHEDULED: "RESCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;

export const ADMIN_APPOINTMENT_PRIORITY = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export const DEFAULT_APPOINTMENT_SLOT_MINUTES = 30;

export const adminUserSearchableFields = ["name", "email", "phone"];

export const adminUserFilterableFields = ["role", "status", "isActive", "emailVerified"];

export const adminUserSortableFields = [
  "name",
  "email",
  "role",
  "status",
  "createdAt",
  "updatedAt",
];

export const adminUserSelectableFields = [
  "id",
  "name",
  "email",
  "emailVerified",
  "role",
  "status",
  "image",
  "phone",
  "isActive",
  "createdAt",
  "updatedAt",
];

export const adminAppointmentSearchableFields = [
  "appointmentNo",
  "chiefComplaint",
  "symptoms",
  "emergencyNote",
  "cancelReason",
];

export const adminAppointmentFilterableFields = [
  "patientId",
  "treatedById",
  "createdById",
  "type",
  "status",
  "priority",
];

export const adminAppointmentSortableFields = [
  "appointmentNo",
  "scheduledAt",
  "createdAt",
  "updatedAt",
  "status",
  "priority",
  "type",
];

export const adminAppointmentSelectableFields = [
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
  "createdAt",
  "updatedAt",
];

export const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  role: true,
  status: true,
  image: true,
  phone: true,
  isActive: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  patientProfile: {
    select: {
      id: true,
      address: true,
      emergencyContact: true,
      dateOfBirth: true,
      gender: true,
      bloodGroup: true,
      allergy: true,
      medicalCondition: true,
    },
  },
  doctorProfile: {
    select: {
      id: true,
      bmdcNumber: true,
      specialty: true,
      designation: true,
      bio: true,
      signatureUrl: true,
    },
  },
  managerProfile: {
    select: {
      id: true,
      designation: true,
      phone: true,
    },
  },
};

export const adminAppointmentInclude = {
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
  invoices: {
    where: {
      isDeleted: false,
    },
    select: {
      id: true,
      invoiceNo: true,
      totalAmount: true,
      paidAmount: true,
      dueAmount: true,
      status: true,
    },
  },
  prescriptions: {
    where: {
      isDeleted: false,
    },
    select: {
      id: true,
      notes: true,
      pdfUrl: true,
      createdAt: true,
    },
  },
};

export const getParamId = (id: string | string[] | undefined): string => {
  if (!id || Array.isArray(id)) {
    throw new AppError(status.BAD_REQUEST, "Valid id is required");
  }

  return id;
};

export const normalizeDateTime = (value: string | Date): Date => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(status.BAD_REQUEST, "Invalid date/time");
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

export const getSlotRange = (scheduledAt: Date) => {
  const start = new Date(scheduledAt.getTime() - DEFAULT_APPOINTMENT_SLOT_MINUTES * 60 * 1000);

  const end = new Date(scheduledAt.getTime() + DEFAULT_APPOINTMENT_SLOT_MINUTES * 60 * 1000);

  return {
    start,
    end,
  };
};

export const generateAdminAppointmentNo = async (): Promise<string> => {
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

export const getAppointmentDateRangeWhere = (query: {
  scheduledAtFrom?: string;
  scheduledAtTo?: string;
}): Prisma.AppointmentWhereInput => {
  const scheduledAt: Prisma.DateTimeFilter = {};

  if (query.scheduledAtFrom) {
    scheduledAt.gte = normalizeDateTime(query.scheduledAtFrom);
  }

  if (query.scheduledAtTo) {
    scheduledAt.lte = normalizeDateTime(query.scheduledAtTo);
  }

  if (Object.keys(scheduledAt).length === 0) {
    return {};
  }

  return {
    scheduledAt,
  };
};
