import { z } from "zod";

const idParam = z.object({
  id: z.string().min(1, "Prescription id is required"),
});

const appointmentIdParam = z.object({
  appointmentId: z.string().min(1, "Appointment id is required"),
});

const prescriptionItem = z
  .object({
    medicineName: z
      .string()
      .trim()
      .min(1, "Medicine name is required")
      .max(150, "Medicine name must not exceed 150 characters"),

    dosage: z
      .string()
      .trim()
      .min(1, "Dosage is required")
      .max(100, "Dosage must not exceed 100 characters"),

    frequency: z
      .string()
      .trim()
      .min(1, "Frequency is required")
      .max(100, "Frequency must not exceed 100 characters"),

    duration: z
      .string()
      .trim()
      .min(1, "Duration is required")
      .max(100, "Duration must not exceed 100 characters"),

    instructions: z.string().trim().max(500).nullable().optional(),
  })
  .strict();

const createPrescription = z
  .object({
    appointmentId: z.string().min(1, "Appointment id is required"),

    notes: z.string().trim().max(2000).nullable().optional(),

    pdfUrl: z.string().trim().url("PDF URL must be valid").nullable().optional(),

    items: z
      .array(prescriptionItem)
      .min(1, "At least one prescription item is required")
      .max(50, "Prescription cannot contain more than 50 items"),
  })
  .strict();

const updatePrescription = z
  .object({
    notes: z.string().trim().max(2000).nullable().optional(),

    pdfUrl: z.string().trim().url("PDF URL must be valid").nullable().optional(),

    items: z
      .array(prescriptionItem)
      .min(1, "At least one prescription item is required")
      .max(50, "Prescription cannot contain more than 50 items")
      .optional(),
  })
  .strict();

const getPrescriptionsQuery = z.object({
  searchTerm: z.string().trim().optional(),

  appointmentId: z.string().trim().optional(),

  createdById: z.string().trim().optional(),

  updatedById: z.string().trim().optional(),

  patientId: z.string().trim().optional(),

  createdAtFrom: z.string().trim().optional(),

  createdAtTo: z.string().trim().optional(),

  page: z.union([z.string(), z.number()]).optional(),

  limit: z.union([z.string(), z.number()]).optional(),

  sortBy: z.enum(["createdAt", "updatedAt"]).optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  fields: z.string().trim().optional(),
});

export const PrescriptionValidation = {
  idParam,
  appointmentIdParam,
  createPrescription,
  updatePrescription,
  getPrescriptionsQuery,
};
