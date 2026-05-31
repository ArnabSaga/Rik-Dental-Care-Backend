import { z } from "zod";

const idParam = z.object({
  id: z.string().min(1, "Appointment id is required"),
});

const appointmentService = z.object({
  serviceId: z.string().min(1, "Service id is required"),
  quantity: z.coerce.number().int().min(1).max(20).optional().default(1),
  notes: z.string().trim().max(500).nullable().optional(),
});

const bookRegularAppointment = z
  .object({
    doctorId: z.string().min(1, "Doctor id is required"),

    patientId: z.string().min(1, "Patient id is required").optional(),

    scheduledAt: z.union([
      z.string().datetime("Invalid scheduledAt date/time"),
      z.string().min(1, "scheduledAt is required"),
      z.date(),
    ]),

    chiefComplaint: z.string().trim().max(1000).nullable().optional(),

    symptoms: z.string().trim().max(1000).nullable().optional(),

    services: z.array(appointmentService).max(10).optional(),
  })
  .strict();

const bookEmergencyAppointment = z
  .object({
    doctorId: z.string().min(1, "Doctor id is required"),

    patientId: z.string().min(1, "Patient id is required").optional(),

    scheduledAt: z
      .union([
        z.string().datetime("Invalid scheduledAt date/time"),
        z.string().min(1),
        z.date(),
      ])
      .optional(),

    description: z
      .string()
      .trim()
      .min(5, "Emergency description must be at least 5 characters")
      .max(1500, "Emergency description must not exceed 1500 characters"),

    symptoms: z.string().trim().max(1000).nullable().optional(),

    services: z.array(appointmentService).max(10).optional(),
  })
  .strict();

const updateAppointment = z
  .object({
    doctorId: z.string().min(1, "Doctor id is required").optional(),

    scheduledAt: z
      .union([
        z.string().datetime("Invalid scheduledAt date/time"),
        z.string().min(1),
        z.date(),
      ])
      .optional(),

    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "RESCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ])
      .optional(),

    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),

    chiefComplaint: z.string().trim().max(1000).nullable().optional(),

    symptoms: z.string().trim().max(1000).nullable().optional(),

    emergencyNote: z.string().trim().max(1500).nullable().optional(),

    cancelReason: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

const getAppointmentsQuery = z.object({
  searchTerm: z.string().trim().optional(),

  patientId: z.string().trim().optional(),

  treatedById: z.string().trim().optional(),

  createdById: z.string().trim().optional(),

  type: z.enum(["REGULAR", "EMERGENCY"]).optional(),

  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "RESCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ])
    .optional(),

  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),

  scheduledAtFrom: z.string().trim().optional(),

  scheduledAtTo: z.string().trim().optional(),

  page: z.union([z.string(), z.number()]).optional(),

  limit: z.union([z.string(), z.number()]).optional(),

  sortBy: z
    .enum([
      "appointmentNo",
      "scheduledAt",
      "createdAt",
      "updatedAt",
      "status",
      "priority",
      "type",
    ])
    .optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  fields: z.string().trim().optional(),
});

export const AppointmentValidation = {
  idParam,
  bookRegularAppointment,
  bookEmergencyAppointment,
  updateAppointment,
  getAppointmentsQuery,
};
