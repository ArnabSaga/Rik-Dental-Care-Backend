import status from "http-status";
import { Prisma, User } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";
import { QueryBuilder } from "../../shared/helpers/queryHelper";
import { paginationHelper } from "../../shared/helpers/paginationHelper";
import {
  IAdminAppointmentQuery,
  IAdminAppointmentServicePayload,
  IAdminCreateAppointmentPayload,
  IAdminUserQuery,
} from "./admin.interface";
import {
  ADMIN_APPOINTMENT_PRIORITY,
  ADMIN_APPOINTMENT_STATUS,
  ADMIN_APPOINTMENT_TYPE,
  ADMIN_ROLE,
  adminAppointmentFilterableFields,
  adminAppointmentInclude,
  adminAppointmentSearchableFields,
  adminAppointmentSelectableFields,
  adminAppointmentSortableFields,
  adminUserSearchableFields,
  adminUserSelect,
  adminUserSortableFields,
  ensureFutureDate,
  generateAdminAppointmentNo,
  getAppointmentDateRangeWhere,
  getSlotRange,
  normalizeDateTime,
} from "./admin.utils";

const parseBoolean = (
  value: string | boolean | undefined,
): boolean | undefined => {
  if (value === undefined) return undefined;

  if (typeof value === "boolean") return value;

  if (value === "true" || value === "1") return true;

  if (value === "false" || value === "0") return false;

  return undefined;
};

const ensurePatientExists = async (patientId: string) => {
  const patient = await prisma.user.findFirst({
    where: {
      id: patientId,
      role: ADMIN_ROLE.PATIENT,
      isActive: true,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!patient) {
    throw new AppError(status.NOT_FOUND, "Patient not found or inactive");
  }

  return patient;
};

const ensureDoctorExists = async (doctorId: string) => {
  const doctor = await prisma.user.findFirst({
    where: {
      id: doctorId,
      role: ADMIN_ROLE.ADMIN,
      isActive: true,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!doctor) {
    throw new AppError(status.NOT_FOUND, "Doctor/Admin not found or inactive");
  }

  return doctor;
};

const ensurePatientProfileCompleted = async (patientId: string) => {
  const profile = await prisma.patientProfile.findFirst({
    where: {
      userId: patientId,
      isDeleted: false,
    },
    select: {
      address: true,
      emergencyContact: true,
      dateOfBirth: true,
      gender: true,
      bloodGroup: true,
    },
  });

  if (
    !profile ||
    !profile.address ||
    !profile.emergencyContact ||
    !profile.dateOfBirth ||
    !profile.gender ||
    !profile.bloodGroup
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "Patient profile is incomplete. Complete profile before appointment booking",
    );
  }
};

const checkAppointmentConflict = async (
  treatedById: string,
  scheduledAt: Date,
) => {
  const { start, end } = getSlotRange(scheduledAt);

  const conflict = await prisma.appointment.findFirst({
    where: {
      treatedById,
      isDeleted: false,
      status: {
        notIn: [
          ADMIN_APPOINTMENT_STATUS.CANCELLED,
          ADMIN_APPOINTMENT_STATUS.COMPLETED,
          ADMIN_APPOINTMENT_STATUS.NO_SHOW,
        ],
      },
      scheduledAt: {
        gte: start,
        lt: end,
      },
    },
    select: {
      id: true,
      appointmentNo: true,
      scheduledAt: true,
    },
  });

  if (conflict) {
    throw new AppError(
      status.CONFLICT,
      `Doctor already has appointment ${conflict.appointmentNo} around ${conflict.scheduledAt.toISOString()}`,
    );
  }
};

const prepareAppointmentServices = async (
  services?: IAdminAppointmentServicePayload[],
) => {
  if (!services || services.length === 0) {
    return [];
  }

  const uniqueServiceIds = [
    ...new Set(services.map((service) => service.serviceId)),
  ];

  const dentalServices = await prisma.dentalService.findMany({
    where: {
      id: {
        in: uniqueServiceIds,
      },
      isActive: true,
      isDeleted: false,
    },
    select: {
      id: true,
      basePrice: true,
    },
  });

  if (dentalServices.length !== uniqueServiceIds.length) {
    throw new AppError(
      status.BAD_REQUEST,
      "One or more dental services are invalid or inactive",
    );
  }

  const servicePriceMap = new Map(
    dentalServices.map((service) => [service.id, service.basePrice]),
  );

  return services.map((service) => ({
    serviceId: service.serviceId,
    quantity: service.quantity ?? 1,
    notes: service.notes,
    unitPrice: servicePriceMap.get(service.serviceId),
  }));
};

const getDashboardStats = async () => {
  const today = new Date();

  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const [
    totalUsers,
    totalPatients,
    totalManagers,
    totalAppointments,
    todayAppointments,
    pendingAppointments,
    emergencyAppointments,
    totalInvoices,
    unpaidInvoices,
    unreadNotifications,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        isDeleted: false,
      },
    }),

    prisma.user.count({
      where: {
        role: ADMIN_ROLE.PATIENT,
        isDeleted: false,
      },
    }),

    prisma.user.count({
      where: {
        role: ADMIN_ROLE.MANAGER,
        isDeleted: false,
      },
    }),

    prisma.appointment.count({
      where: {
        isDeleted: false,
      },
    }),

    prisma.appointment.count({
      where: {
        isDeleted: false,
        scheduledAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    }),

    prisma.appointment.count({
      where: {
        isDeleted: false,
        status: ADMIN_APPOINTMENT_STATUS.PENDING,
      },
    }),

    prisma.appointment.count({
      where: {
        isDeleted: false,
        type: ADMIN_APPOINTMENT_TYPE.EMERGENCY,
      },
    }),

    prisma.invoice.count({
      where: {
        isDeleted: false,
      },
    }),

    prisma.invoice.count({
      where: {
        isDeleted: false,
        status: {
          in: ["DRAFT", "ISSUED", "PARTIALLY_PAID", "OVERDUE"],
        },
      },
    }),

    prisma.notification.count({
      where: {
        isDeleted: false,
        isRead: false,
      },
    }),
  ]);

  const invoiceAgg = await prisma.invoice.aggregate({
    where: {
      isDeleted: false,
      status: {
        notIn: ["CANCELLED", "REFUNDED"],
      },
    },
    _sum: {
      totalAmount: true,
      paidAmount: true,
      dueAmount: true,
    },
  });

  return {
    users: {
      totalUsers,
      totalPatients,
      totalManagers,
    },
    appointments: {
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      emergencyAppointments,
    },
    invoices: {
      totalInvoices,
      unpaidInvoices,
      totalAmount: invoiceAgg._sum.totalAmount ?? 0,
      paidAmount: invoiceAgg._sum.paidAmount ?? 0,
      dueAmount: invoiceAgg._sum.dueAmount ?? 0,
    },
    notifications: {
      unreadNotifications,
    },
  };
};

const getUsers = async (query: IAdminUserQuery) => {
  const pagination = paginationHelper.calculatePagination(query, {
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultLimit: 10,
    maxLimit: 100,
  });

  const safeSortBy = adminUserSortableFields.includes(pagination.sortBy)
    ? pagination.sortBy
    : "createdAt";

  const where: Prisma.UserWhereInput = {
    isDeleted: false,
  };

  if (query.searchTerm) {
    where.OR = [
      {
        name: {
          contains: query.searchTerm,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: query.searchTerm,
          mode: "insensitive",
        },
      },
      {
        phone: {
          contains: query.searchTerm,
          mode: "insensitive",
        },
      },
    ];
  }

  if (query.role) {
    where.role = query.role;
  }

  if (query.status) {
    where.status = query.status;
  }

  const isActive = parseBoolean(query.isActive);

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const emailVerified = parseBoolean(query.emailVerified);

  if (emailVerified !== undefined) {
    where.emailVerified = emailVerified;
  }

  const [total, data] = await Promise.all([
    prisma.user.count({
      where,
    }),

    prisma.user.findMany({
      where,
      select: adminUserSelect,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: {
        [safeSortBy]: pagination.sortOrder,
      } as Prisma.UserOrderByWithRelationInput,
    }),
  ]);

  return {
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

const getAppointments = async (query: IAdminAppointmentQuery) => {
  const baseWhere: Prisma.AppointmentWhereInput = {
    isDeleted: false,
    ...getAppointmentDateRangeWhere(query),
  };

  const safeQuery = {
    ...query,
  };

  delete safeQuery.scheduledAtFrom;
  delete safeQuery.scheduledAtTo;

  const queryBuilder = new QueryBuilder(prisma.appointment, safeQuery, {
    searchableFields: adminAppointmentSearchableFields,
    filterableFields: adminAppointmentFilterableFields,
    sortableFields: adminAppointmentSortableFields,
    selectableFields: adminAppointmentSelectableFields,
    dateFields: ["scheduledAt", "createdAt", "updatedAt"],
    defaultSortBy: "scheduledAt",
    defaultSortOrder: "desc",
    defaultLimit: 10,
    maxLimit: 100,
  });

  const result = await queryBuilder
    .where(baseWhere)
    .include(adminAppointmentInclude)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();

  return result;
};

const getAppointmentById = async (appointmentId: string) => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      isDeleted: false,
    },
    include: adminAppointmentInclude,
  });

  if (!appointment) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }

  return appointment;
};

const createAppointment = async (
  payload: IAdminCreateAppointmentPayload,
  authUser: User,
) => {
  const scheduledAt = normalizeDateTime(payload.scheduledAt);

  ensureFutureDate(scheduledAt);

  await ensurePatientExists(payload.patientId);
  await ensurePatientProfileCompleted(payload.patientId);
  await ensureDoctorExists(payload.doctorId);
  await checkAppointmentConflict(payload.doctorId, scheduledAt);

  const appointmentServices = await prepareAppointmentServices(
    payload.services,
  );
  const appointmentNo = await generateAdminAppointmentNo();

  const appointmentType = payload.type ?? ADMIN_APPOINTMENT_TYPE.REGULAR;

  const priority =
    payload.priority ??
    (appointmentType === ADMIN_APPOINTMENT_TYPE.EMERGENCY
      ? ADMIN_APPOINTMENT_PRIORITY.URGENT
      : ADMIN_APPOINTMENT_PRIORITY.NORMAL);

  const appointment = await prisma.appointment.create({
    data: {
      appointmentNo,
      patientId: payload.patientId,
      treatedById: payload.doctorId,
      createdById: authUser.id,
      scheduledAt,
      type: appointmentType,
      status: ADMIN_APPOINTMENT_STATUS.PENDING,
      priority,
      chiefComplaint: payload.chiefComplaint,
      symptoms: payload.symptoms,
      emergencyNote: payload.emergencyNote,
      ...(appointmentServices.length > 0
        ? {
            appointmentServices: {
              create: appointmentServices,
            },
          }
        : {}),
    },
    include: adminAppointmentInclude,
  });

  return appointment;
};

export const AdminService = {
  getDashboardStats,
  getUsers,
  getAppointments,
  getAppointmentById,
  createAppointment,
};
