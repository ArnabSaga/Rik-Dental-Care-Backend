import { z } from "zod";

const idParam = z.object({
  id: z.string().min(1, "Medical history id is required"),
});

const createMedicalHistory = z
  .object({
    title: z.string().trim().max(150).nullable().optional(),

    description: z
      .string()
      .trim()
      .min(3, "Description must be at least 3 characters")
      .max(3000, "Description must not exceed 3000 characters"),

    date: z.union([
      z.string().datetime("Invalid date"),
      z.string().date("Invalid date"),
      z.string().min(1, "Date is required"),
      z.date(),
    ]),

    type: z
      .enum(["ALLERGY", "SURGERY", "DISEASE", "MEDICATION", "DENTAL_HISTORY", "OTHER"])
      .optional()
      .default("OTHER"),

    allergy: z.string().trim().max(1000).nullable().optional(),

    condition: z.string().trim().max(1000).nullable().optional(),

    medication: z.string().trim().max(1000).nullable().optional(),

    patientProfileId: z.string().trim().min(1).optional(),
  })
  .strict();

const updateMedicalHistory = z
  .object({
    title: z.string().trim().max(150).nullable().optional(),

    description: z
      .string()
      .trim()
      .min(3, "Description must be at least 3 characters")
      .max(3000, "Description must not exceed 3000 characters")
      .optional(),

    date: z
      .union([
        z.string().datetime("Invalid date"),
        z.string().date("Invalid date"),
        z.string().min(1),
        z.date(),
      ])
      .optional(),

    type: z
      .enum(["ALLERGY", "SURGERY", "DISEASE", "MEDICATION", "DENTAL_HISTORY", "OTHER"])
      .optional(),

    allergy: z.string().trim().max(1000).nullable().optional(),

    condition: z.string().trim().max(1000).nullable().optional(),

    medication: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

const getMedicalHistoryQuery = z.object({
  searchTerm: z.string().trim().optional(),

  patientProfileId: z.string().trim().optional(),

  type: z
    .enum(["ALLERGY", "SURGERY", "DISEASE", "MEDICATION", "DENTAL_HISTORY", "OTHER"])
    .optional(),

  dateFrom: z.string().trim().optional(),

  dateTo: z.string().trim().optional(),

  page: z.union([z.string(), z.number()]).optional(),

  limit: z.union([z.string(), z.number()]).optional(),

  sortBy: z.enum(["date", "createdAt", "updatedAt", "type", "title"]).optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  fields: z.string().trim().optional(),
});

export const MedicalHistoryValidation = {
  idParam,
  createMedicalHistory,
  updateMedicalHistory,
  getMedicalHistoryQuery,
};
