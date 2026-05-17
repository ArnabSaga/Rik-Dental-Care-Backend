import { z } from "zod";

const idParam = z.object({
  id: z.string().min(1, "User id is required"),
});

const updateMe = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .optional(),

    phone: z.string().trim().min(5).max(20).nullable().optional(),

    image: z.string().trim().url("Image must be a valid URL").nullable().optional(),
  })
  .strict();

const updateByAdmin = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .optional(),

    phone: z.string().trim().min(5).max(20).nullable().optional(),

    image: z.string().trim().url("Image must be a valid URL").nullable().optional(),

    role: z.enum(["ADMIN", "PATIENT", "MANAGER"]).optional(),

    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),

    isActive: z.boolean().optional(),

    emailVerified: z.boolean().optional(),
  })
  .strict();

const getAllUsersQuery = z.object({
  searchTerm: z.string().trim().optional(),

  role: z.enum(["ADMIN", "PATIENT", "MANAGER"]).optional(),

  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),

  isActive: z.union([z.boolean(), z.enum(["true", "false", "1", "0"])]).optional(),

  emailVerified: z.union([z.boolean(), z.enum(["true", "false", "1", "0"])]).optional(),

  page: z.union([z.string(), z.number()]).optional(),

  limit: z.union([z.string(), z.number()]).optional(),

  sortBy: z.enum(["name", "email", "role", "status", "createdAt", "updatedAt"]).optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  fields: z.string().trim().optional(),
});

export const UserValidation = {
  idParam,
  updateMe,
  updateByAdmin,
  getAllUsersQuery,
};
