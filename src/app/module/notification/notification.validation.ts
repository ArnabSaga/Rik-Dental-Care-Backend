import { z } from "zod";

const idParam = z.object({
  id: z.string().min(1, "Notification id is required"),
});

const createNotification = z
  .object({
    recipientId: z.string().min(1, "Recipient id is required"),

    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(150, "Title must not exceed 150 characters"),

    message: z
      .string()
      .trim()
      .min(2, "Message must be at least 2 characters")
      .max(1000, "Message must not exceed 1000 characters"),

    type: z
      .enum([
        "APPOINTMENT",
        "EMERGENCY",
        "REMINDER",
        "PRESCRIPTION",
        "INVOICE",
        "SYSTEM",
      ])
      .optional()
      .default("SYSTEM"),

    entityType: z
      .enum([
        "APPOINTMENT",
        "INVOICE",
        "PRESCRIPTION",
        "MEDICAL_HISTORY",
        "CLINICAL_NOTE",
        "TREATMENT_PLAN",
        "PAYMENT",
      ])
      .nullable()
      .optional(),

    entityId: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

const markNotificationsRead = z
  .object({
    ids: z
      .array(z.string().min(1, "Notification id is required"))
      .min(1, "At least one notification id is required")
      .max(100, "Cannot mark more than 100 notifications at a time"),
  })
  .strict();

const getNotificationsQuery = z.object({
  searchTerm: z.string().trim().optional(),

  recipientId: z.string().trim().optional(),

  type: z
    .enum([
      "APPOINTMENT",
      "EMERGENCY",
      "REMINDER",
      "PRESCRIPTION",
      "INVOICE",
      "SYSTEM",
    ])
    .optional(),

  entityType: z
    .enum([
      "APPOINTMENT",
      "INVOICE",
      "PRESCRIPTION",
      "MEDICAL_HISTORY",
      "CLINICAL_NOTE",
      "TREATMENT_PLAN",
      "PAYMENT",
    ])
    .optional(),

  entityId: z.string().trim().optional(),

  isRead: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
    .optional(),

  createdAtFrom: z.string().trim().optional(),

  createdAtTo: z.string().trim().optional(),

  page: z.union([z.string(), z.number()]).optional(),

  limit: z.union([z.string(), z.number()]).optional(),

  sortBy: z
    .enum(["createdAt", "updatedAt", "readAt", "type", "isRead"])
    .optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  fields: z.string().trim().optional(),
});

export const NotificationValidation = {
  idParam,
  createNotification,
  markNotificationsRead,
  getNotificationsQuery,
};
