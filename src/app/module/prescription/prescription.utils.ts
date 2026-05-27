import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import AppError from "../../shared/errors/AppError";

export const PRESCRIPTION_ROLE = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  MANAGER: "MANAGER",
} as const;

export const PRESCRIPTION_APPOINTMENT_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  RESCHEDULED: "RESCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;

export const ATTACHMENT_TYPE = {
  IMAGE: "IMAGE",
  PDF: "PDF",
  DOCUMENT: "DOCUMENT",
  OTHER: "OTHER",
} as const;

export const prescriptionSearchableFields = ["notes", "pdfUrl"];

export const prescriptionFilterableFields = ["appointmentId", "createdById", "updatedById"];

export const prescriptionSortableFields = ["createdAt", "updatedAt"];

export const prescriptionSelectableFields = [
  "id",
  "appointmentId",
  "notes",
  "pdfUrl",
  "createdById",
  "updatedById",
  "createdAt",
  "updatedAt",
];

export const prescriptionInclude = {
  items: {
    select: {
      id: true,
      medicineName: true,
      dosage: true,
      frequency: true,
      duration: true,
      instructions: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  attachments: {
    where: {
      isDeleted: false,
    },
    select: {
      id: true,
      url: true,
      publicId: true,
      fileType: true,
      resourceType: true,
      createdAt: true,
    },
  },
  appointment: {
    select: {
      id: true,
      appointmentNo: true,
      patientId: true,
      treatedById: true,
      scheduledAt: true,
      type: true,
      status: true,
      priority: true,
      chiefComplaint: true,
      symptoms: true,
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
    },
  },
  updatedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
    },
  },
};

export const getParamId = (id: string | string[] | undefined): string => {
  if (!id || Array.isArray(id)) {
    throw new AppError(status.BAD_REQUEST, "Valid prescription id is required");
  }

  return id;
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

export const normalizeDate = (value: string): Date => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(status.BAD_REQUEST, "Invalid date");
  }

  return date;
};

export const getPrescriptionCreatedAtRangeWhere = (query: {
  createdAtFrom?: string;
  createdAtTo?: string;
}): Prisma.PrescriptionWhereInput => {
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

export const getAttachmentTypeFromMime = (
  mimeType?: string
): "IMAGE" | "PDF" | "DOCUMENT" | "OTHER" => {
  if (!mimeType) return ATTACHMENT_TYPE.OTHER;

  if (mimeType.startsWith("image/")) {
    return ATTACHMENT_TYPE.IMAGE;
  }

  if (mimeType === "application/pdf") {
    return ATTACHMENT_TYPE.PDF;
  }

  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("officedocument")
  ) {
    return ATTACHMENT_TYPE.DOCUMENT;
  }

  return ATTACHMENT_TYPE.OTHER;
};

export const getUploadedFileUrl = (file?: Express.Multer.File): string | undefined => {
  if (!file) return undefined;

  const possibleFile = file as Express.Multer.File & {
    path?: string;
    secure_url?: string;
    url?: string;
  };

  return possibleFile.path || possibleFile.secure_url || possibleFile.url;
};

export const getUploadedFilePublicId = (file?: Express.Multer.File): string | undefined => {
  if (!file) return undefined;

  const possibleFile = file as Express.Multer.File & {
    filename?: string;
    public_id?: string;
  };

  return possibleFile.filename || possibleFile.public_id;
};
