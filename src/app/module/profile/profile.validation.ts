import { z } from "zod";

const idParam = z.object({
  id: z.string().min(1, "Profile id is required"),
});

const userIdParam = z.object({
  userId: z.string().min(1, "User id is required"),
});

const patientProfile = z
  .object({
    address: z
      .string()
      .trim()
      .min(2, "Address must be at least 2 characters")
      .max(500, "Address must not exceed 500 characters")
      .nullable()
      .optional(),

    emergencyContact: z
      .string()
      .trim()
      .min(5, "Emergency contact must be at least 5 characters")
      .max(50, "Emergency contact must not exceed 50 characters")
      .nullable()
      .optional(),

    dateOfBirth: z
      .union([z.string().datetime(), z.string().date(), z.date()])
      .nullable()
      .optional(),

    gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional(),

    bloodGroup: z
      .enum(["APLUS", "AMINUS", "BPLUS", "BMINUS", "ABPLUS", "ABMINUS", "OPLUS", "OMINUS"])
      .nullable()
      .optional(),

    allergy: z
      .string()
      .trim()
      .max(1000, "Allergy information must not exceed 1000 characters")
      .nullable()
      .optional(),

    medicalCondition: z
      .string()
      .trim()
      .max(1000, "Medical condition must not exceed 1000 characters")
      .nullable()
      .optional(),
  })
  .strict();

const doctorProfile = z
  .object({
    bmdcNumber: z.string().trim().max(100).nullable().optional(),
    specialty: z.string().trim().max(150).nullable().optional(),
    designation: z.string().trim().max(150).nullable().optional(),
    bio: z.string().trim().max(2000).nullable().optional(),
    signatureUrl: z.string().trim().url("Signature URL must be valid").nullable().optional(),
  })
  .strict();

const managerProfile = z
  .object({
    designation: z.string().trim().max(150).nullable().optional(),
    phone: z.string().trim().min(5).max(20).nullable().optional(),
  })
  .strict();

const patientProfileQuery = z.object({
  searchTerm: z.string().trim().optional(),

  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

  bloodGroup: z
    .enum(["APLUS", "AMINUS", "BPLUS", "BMINUS", "ABPLUS", "ABMINUS", "OPLUS", "OMINUS"])
    .optional(),

  page: z.union([z.string(), z.number()]).optional(),

  limit: z.union([z.string(), z.number()]).optional(),

  sortBy: z.enum(["createdAt", "updatedAt", "dateOfBirth", "gender", "bloodGroup"]).optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  fields: z.string().trim().optional(),
});

export const ProfileValidation = {
  idParam,
  userIdParam,
  patientProfile,
  doctorProfile,
  managerProfile,
  patientProfileQuery,
};
