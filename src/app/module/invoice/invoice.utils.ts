import status from "http-status";
import type { InvoiceStatus } from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";

export const INVOICE_ROLE = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  MANAGER: "MANAGER",
} as const;

export const INVOICE_STATUS = {
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const satisfies Record<string, InvoiceStatus>;

export const ATTACHMENT_TYPE = {
  IMAGE: "IMAGE",
  PDF: "PDF",
  DOCUMENT: "DOCUMENT",
  OTHER: "OTHER",
} as const;

export const invoiceSearchableFields = ["invoiceNo", "pdfUrl"];

export const invoiceFilterableFields = [
  "appointmentId",
  "issuedById",
  "status",
];

export const invoiceSortableFields = [
  "invoiceNo",
  "subtotalAmount",
  "discountAmount",
  "taxAmount",
  "totalAmount",
  "paidAmount",
  "dueAmount",
  "status",
  "dueDate",
  "createdAt",
  "updatedAt",
];

export const invoiceSelectableFields = [
  "id",
  "invoiceNo",
  "appointmentId",
  "issuedById",
  "subtotalAmount",
  "discountAmount",
  "taxAmount",
  "totalAmount",
  "paidAmount",
  "dueAmount",
  "status",
  "dueDate",
  "pdfUrl",
  "createdAt",
  "updatedAt",
];

export const invoiceInclude = {
  items: {
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
  payments: {
    where: {
      isDeleted: false,
    },
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      transactionId: true,
      paidAt: true,
      notes: true,
      receivedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
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
  issuedBy: {
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
    throw new AppError(status.BAD_REQUEST, "Valid invoice id is required");
  }

  return id;
};

export const normalizeDate = (
  value?: string | Date | null,
): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(status.BAD_REQUEST, "Invalid date");
  }

  return date;
};

export const toDecimal = (value: number | string | Prisma.Decimal) => {
  return new Prisma.Decimal(value);
};

export const decimalToNumber = (
  value: number | string | Prisma.Decimal | null | undefined,
): number => {
  if (value === null || value === undefined) return 0;
  return Number(value);
};

export const calculateLineTotal = (
  quantity: number,
  unitPrice: number,
  discountAmount = 0,
): number => {
  const total = quantity * unitPrice - discountAmount;

  if (total < 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "Invoice item total cannot be negative",
    );
  }

  return Number(total.toFixed(2));
};

export const calculateInvoiceTotals = (input: {
  items: Array<{
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
  }>;
  discountAmount?: number;
  taxAmount?: number;
  paidAmount?: number;
}) => {
  const subtotalAmount = input.items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice - (item.discountAmount ?? 0);
  }, 0);

  const discountAmount = input.discountAmount ?? 0;
  const taxAmount = input.taxAmount ?? 0;
  const paidAmount = input.paidAmount ?? 0;

  const totalAmount = subtotalAmount - discountAmount + taxAmount;

  if (subtotalAmount < 0 || totalAmount < 0) {
    throw new AppError(status.BAD_REQUEST, "Invoice amount cannot be negative");
  }

  if (paidAmount > totalAmount) {
    throw new AppError(
      status.BAD_REQUEST,
      "Paid amount cannot be greater than total amount",
    );
  }

  const dueAmount = totalAmount - paidAmount;

  return {
    subtotalAmount: Number(subtotalAmount.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    paidAmount: Number(paidAmount.toFixed(2)),
    dueAmount: Number(dueAmount.toFixed(2)),
  };
};

export const resolveInvoiceStatus = (input: {
  requestedStatus?: InvoiceStatus;
  paidAmount: number;
  totalAmount: number;
  dueAmount: number;
  dueDate?: Date | null;
}): InvoiceStatus => {
  if (input.requestedStatus === INVOICE_STATUS.CANCELLED) {
    return INVOICE_STATUS.CANCELLED;
  }

  if (input.requestedStatus === INVOICE_STATUS.REFUNDED) {
    return INVOICE_STATUS.REFUNDED;
  }

  if (input.totalAmount > 0 && input.paidAmount >= input.totalAmount) {
    return INVOICE_STATUS.PAID;
  }

  if (input.paidAmount > 0 && input.dueAmount > 0) {
    return INVOICE_STATUS.PARTIALLY_PAID;
  }

  if (input.dueDate && input.dueDate < new Date()) {
    return INVOICE_STATUS.OVERDUE;
  }

  return input.requestedStatus ?? INVOICE_STATUS.ISSUED;
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

export const generateInvoiceNo = async (): Promise<string> => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const prefix = `INV-${year}${month}${day}`;

  const count = await prisma.invoice.count({
    where: {
      invoiceNo: {
        startsWith: prefix,
      },
    },
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
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

export const getInvoiceDateRangeWhere = (query: {
  dueDateFrom?: string;
  dueDateTo?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
}): Prisma.InvoiceWhereInput => {
  const where: Prisma.InvoiceWhereInput = {};

  const dueDate: Prisma.DateTimeNullableFilter = {};
  const createdAt: Prisma.DateTimeFilter = {};

  if (query.dueDateFrom) {
    dueDate.gte = normalizeDate(query.dueDateFrom) as Date;
  }

  if (query.dueDateTo) {
    dueDate.lte = normalizeDate(query.dueDateTo) as Date;
  }

  if (query.createdAtFrom) {
    createdAt.gte = normalizeDate(query.createdAtFrom) as Date;
  }

  if (query.createdAtTo) {
    createdAt.lte = normalizeDate(query.createdAtTo) as Date;
  }

  if (Object.keys(dueDate).length > 0) {
    where.dueDate = dueDate;
  }

  if (Object.keys(createdAt).length > 0) {
    where.createdAt = createdAt;
  }

  return where;
};
