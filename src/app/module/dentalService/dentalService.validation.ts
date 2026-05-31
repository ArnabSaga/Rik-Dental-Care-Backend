import { z } from "zod";

const idParam = z.object({
  id: z.string().min(1, "Dental service id is required"),
});

const createDentalService = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Service name must be at least 2 characters")
      .max(150, "Service name must not exceed 150 characters"),

    description: z
      .string()
      .trim()
      .max(1000, "Description must not exceed 1000 characters")
      .nullable()
      .optional(),

    basePrice: z.coerce
      .number()
      .positive("Base price must be greater than 0")
      .max(99999999, "Base price is too high"),

    slug: z
      .string()
      .trim()
      .min(2, "Slug must be at least 2 characters")
      .max(180, "Slug must not exceed 180 characters")
      .optional(),

    isActive: z.boolean().optional().default(true),
  })
  .strict();

const updateDentalService = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Service name must be at least 2 characters")
      .max(150, "Service name must not exceed 150 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000, "Description must not exceed 1000 characters")
      .nullable()
      .optional(),

    basePrice: z.coerce
      .number()
      .positive("Base price must be greater than 0")
      .max(99999999, "Base price is too high")
      .optional(),

    slug: z
      .string()
      .trim()
      .min(2, "Slug must be at least 2 characters")
      .max(180, "Slug must not exceed 180 characters")
      .optional(),

    isActive: z.boolean().optional(),
  })
  .strict();

const updateDentalServiceStatus = z
  .object({
    isActive: z.boolean({
      error: "isActive is required",
    }),
  })
  .strict();

const getAllDentalServicesQuery = z.object({
  searchTerm: z.string().trim().optional(),

  isActive: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
    .optional(),

  page: z.union([z.string(), z.number()]).optional(),

  limit: z.union([z.string(), z.number()]).optional(),

  sortBy: z
    .enum(["name", "basePrice", "isActive", "createdAt", "updatedAt"])
    .optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  fields: z.string().trim().optional(),
});

export const DentalServiceValidation = {
  idParam,
  createDentalService,
  updateDentalService,
  updateDentalServiceStatus,
  getAllDentalServicesQuery,
};
