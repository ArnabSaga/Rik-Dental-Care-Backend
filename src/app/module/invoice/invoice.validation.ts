import { z } from "zod";

const idParam = z.object({
  id: z.string().min(1, "Invoice id is required"),
});

const invoiceItem = z
  .object({
    serviceId: z.string().trim().min(1).nullable().optional(),

    serviceName: z
      .string()
      .trim()
      .min(1, "Service name is required")
      .max(150, "Service name must not exceed 150 characters"),

    description: z.string().trim().max(1000).nullable().optional(),

    quantity: z.coerce.number().int().min(1).max(100).optional().default(1),

    unitPrice: z.coerce
      .number()
      .min(0, "Unit price cannot be negative")
      .max(99999999, "Unit price is too high"),

    discountAmount: z.coerce
      .number()
      .min(0, "Discount cannot be negative")
      .max(99999999, "Discount amount is too high")
      .optional()
      .default(0),
  })
  .strict();

const createInvoice = z
  .object({
    appointmentId: z.string().min(1, "Appointment id is required"),

    dueDate: z
      .union([
        z.string().datetime("Invalid due date"),
        z.string().date("Invalid due date"),
        z.date(),
      ])
      .nullable()
      .optional(),

    discountAmount: z.coerce.number().min(0, "Discount cannot be negative").optional().default(0),

    taxAmount: z.coerce.number().min(0, "Tax cannot be negative").optional().default(0),

    status: z
      .enum(["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "REFUNDED"])
      .optional(),

    pdfUrl: z.string().trim().url("PDF URL must be valid").nullable().optional(),

    items: z.array(invoiceItem).min(1).max(100).optional(),
  })
  .strict();

const updateInvoice = z
  .object({
    dueDate: z
      .union([
        z.string().datetime("Invalid due date"),
        z.string().date("Invalid due date"),
        z.date(),
      ])
      .nullable()
      .optional(),

    discountAmount: z.coerce.number().min(0, "Discount cannot be negative").optional(),

    taxAmount: z.coerce.number().min(0, "Tax cannot be negative").optional(),

    paidAmount: z.coerce.number().min(0, "Paid amount cannot be negative").optional(),

    status: z
      .enum(["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "REFUNDED"])
      .optional(),

    pdfUrl: z.string().trim().url("PDF URL must be valid").nullable().optional(),

    items: z.array(invoiceItem).min(1).max(100).optional(),
  })
  .strict();

const getInvoicesQuery = z.object({
  searchTerm: z.string().trim().optional(),

  appointmentId: z.string().trim().optional(),

  issuedById: z.string().trim().optional(),

  patientId: z.string().trim().optional(),

  status: z
    .enum(["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "REFUNDED"])
    .optional(),

  dueDateFrom: z.string().trim().optional(),

  dueDateTo: z.string().trim().optional(),

  createdAtFrom: z.string().trim().optional(),

  createdAtTo: z.string().trim().optional(),

  page: z.union([z.string(), z.number()]).optional(),

  limit: z.union([z.string(), z.number()]).optional(),

  sortBy: z
    .enum([
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
    ])
    .optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  fields: z.string().trim().optional(),
});

export const InvoiceValidation = {
  idParam,
  createInvoice,
  updateInvoice,
  getInvoicesQuery,
};
