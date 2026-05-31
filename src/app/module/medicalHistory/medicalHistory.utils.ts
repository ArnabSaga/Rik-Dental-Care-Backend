import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import AppError from "../../shared/errors/AppError";

export const MEDICAL_HISTORY_ROLE = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  MANAGER: "MANAGER",
} as const;

export const MEDICAL_HISTORY_TYPE = {
  ALLERGY: "ALLERGY",
  SURGERY: "SURGERY",
  DISEASE: "DISEASE",
  MEDICATION: "MEDICATION",
  DENTAL_HISTORY: "DENTAL_HISTORY",
  OTHER: "OTHER",
} as const;

export const ATTACHMENT_TYPE = {
  IMAGE: "IMAGE",
  PDF: "PDF",
  DOCUMENT: "DOCUMENT",
  OTHER: "OTHER",
} as const;

export const medicalHistorySearchableFields = [
  "title",
  "description",
  "allergy",
  "condition",
  "medication",
];

export const medicalHistoryFilterableFields = ["patientProfileId", "type"];

export const medicalHistorySortableFields = [
  "date",
  "createdAt",
  "updatedAt",
  "type",
  "title",
];

export const medicalHistorySelectableFields = [
  "id",
  "title",
  "description",
  "date",
  "type",
  "allergy",
  "condition",
  "medication",
  "patientProfileId",
  "createdAt",
  "updatedAt",
];

export const medicalHistoryInclude = {
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
  patientProfile: {
    select: {
      id: true,
      userId: true,
      address: true,
      emergencyContact: true,
      gender: true,
      bloodGroup: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          image: true,
        },
      },
    },
  },
};

export const getParamId = (id: string | string[] | undefined): string => {
  if (!id || Array.isArray(id)) {
    throw new AppError(
      status.BAD_REQUEST,
      "Valid medical history id is required",
    );
  }

  return id;
};

export const normalizeDate = (value: string | Date): Date => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(status.BAD_REQUEST, "Invalid medical history date");
  }

  return date;
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

export const getAttachmentTypeFromMime = (
  mimeType?: string,
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

export const getUploadedFileUrl = (
  file?: Express.Multer.File,
): string | undefined => {
  if (!file) return undefined;

  const possibleFile = file as Express.Multer.File & {
    path?: string;
    secure_url?: string;
    url?: string;
  };

  return possibleFile.path || possibleFile.secure_url || possibleFile.url;
};

export const getUploadedFilePublicId = (
  file?: Express.Multer.File,
): string | undefined => {
  if (!file) return undefined;

  const possibleFile = file as Express.Multer.File & {
    filename?: string;
    public_id?: string;
  };

  return possibleFile.filename || possibleFile.public_id;
};

export const getMedicalHistoryDateRangeWhere = (query: {
  dateFrom?: string;
  dateTo?: string;
}): Prisma.MedicalHistoryWhereInput => {
  const date: Prisma.DateTimeFilter = {};

  if (query.dateFrom) {
    date.gte = normalizeDate(query.dateFrom);
  }

  if (query.dateTo) {
    date.lte = normalizeDate(query.dateTo);
  }

  if (Object.keys(date).length === 0) {
    return {};
  }

  return {
    date,
  };
};
