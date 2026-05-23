import status from "http-status";
import { Prisma, User } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";
import { QueryBuilder } from "../../shared/helpers/queryHelper";
import {
  IAppointmentQuery,
  IAppointmentServicePayload,
  IBookEmergencyAppointmentPayload,
  IBookRegularAppointmentPayload,
  IUpdateAppointmentPayload,
} from "./appointment.interface";
import {
  APPOINTMENT_PRIORITY,
  APPOINTMENT_ROLE,
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPE,
  appointmentFilterableFields,
  appointmentInclude,
  appointmentSearchableFields,
  appointmentSelectableFields,
  appointmentSortableFields,
  ensureFutureDate,
  generateAppointmentNo,
  getAppointmentDateRangeWhere,
  getSlotRange,
  normalizeDateTime,
  removeUndefinedFields,
} from "./appointment.utils";

const activeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  isActive: true,
  isDeleted: true,
} as const;

const ensurePatientExists = async (patientId: string) => {
  const patient = await prisma.user.findFirst({
    where: {
      id: patientId,
      role: APPOINTMENT_ROLE.PATIENT,
      isActive: true,
      isDeleted: false,
    },
    select: activeUserSelect,
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
      role: APPOINTMENT_ROLE.ADMIN,
      isActive: true,
      isDeleted: false,
    },
    select: activeUserSelect,
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
      "Please complete patient profile before booking an appointment"
    );
  }
};

const resolvePatientIdForBooking = async (
  payloadPatientId: string | undefined,
  authUser: User
): Promise<string> => {
  if (authUser.role === APPOINTMENT_ROLE.PATIENT) {
    if (payloadPatientId && payloadPatientId !== authUser.id) {
      throw new AppError(status.FORBIDDEN, "Patient can only book own appointment");
    }

    return authUser.id;
  }

  if (authUser.role === APPOINTMENT_ROLE.ADMIN || authUser.role === APPOINTMENT_ROLE.MANAGER) {
    if (!payloadPatientId) {
      throw new AppError(status.BAD_REQUEST, "patientId is required for admin/manager booking");
    }

    return payloadPatientId;
  }

  throw new AppError(status.FORBIDDEN, "You are not allowed to book appointment");
};

const prepareAppointmentServices = async (services?: IAppointmentServicePayload[]) => {
  if (!services || services.length === 0) {
    return [];
  }

  const uniqueServiceIds = [...new Set(services.map((service) => service.serviceId))];

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
    throw new AppError(status.BAD_REQUEST, "One or more dental services are invalid or inactive");
  }

  const servicePriceMap = new Map(dentalServices.map((service) => [service.id, service.basePrice]));

  return services.map((service) => ({
    serviceId: service.serviceId,
    quantity: service.quantity ?? 1,
    notes: service.notes,
    unitPrice: servicePriceMap.get(service.serviceId),
  }));
};

const checkAppointmentConflict = async (
  treatedById: string,
  scheduledAt: Date,
  excludeAppointmentId?: string
) => {
  const { start, end } = getSlotRange(scheduledAt);

  const conflict = await prisma.appointment.findFirst({
    where: {
      treatedById,
      isDeleted: false,
      status: {
        notIn: [
          APPOINTMENT_STATUS.CANCELLED,
          APPOINTMENT_STATUS.COMPLETED,
          APPOINTMENT_STATUS.NO_SHOW,
        ],
      },
      scheduledAt: {
        gte: start,
        lt: end,
      },
      ...(excludeAppointmentId
        ? {
            id: {
              not: excludeAppointmentId,
            },
          }
        : {}),
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
      `Doctor already has an appointment around ${conflict.scheduledAt.toISOString()}`
    );
  }
};

const ensureAppointmentAccess = async (appointmentId: string, authUser: User) => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      isDeleted: false,
    },
    include: appointmentInclude,
  });

  if (!appointment) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }

  const canAccess =
    authUser.role === APPOINTMENT_ROLE.ADMIN ||
    authUser.role === APPOINTMENT_ROLE.MANAGER ||
    appointment.patientId === authUser.id;

  if (!canAccess) {
    throw new AppError(status.FORBIDDEN, "You are not allowed to access this appointment");
  }

  return appointment;
};

const getAppointments = async (query: IAppointmentQuery, authUser: User) => {
  const baseWhere: Prisma.AppointmentWhereInput = {
    isDeleted: false,
    ...getAppointmentDateRangeWhere(query),
  };

  if (authUser.role === APPOINTMENT_ROLE.PATIENT) {
    baseWhere.patientId = authUser.id;
  }

  const safeQuery = {
    ...query,
  };

  delete safeQuery.scheduledAtFrom;
  delete safeQuery.scheduledAtTo;

  const queryBuilder = new QueryBuilder(prisma.appointment, safeQuery, {
    searchableFields: appointmentSearchableFields,
    filterableFields: appointmentFilterableFields,
    sortableFields: appointmentSortableFields,
    selectableFields: appointmentSelectableFields,
    dateFields: ["scheduledAt", "createdAt", "updatedAt"],
    defaultSortBy: "scheduledAt",
    defaultSortOrder: "desc",
    defaultLimit: 10,
    maxLimit: 100,
  });

  const result = await queryBuilder
    .where(baseWhere)
    .include(appointmentInclude)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();

  return result;
};

const bookRegularAppointment = async (payload: IBookRegularAppointmentPayload, authUser: User) => {
  const patientId = await resolvePatientIdForBooking(payload.patientId, authUser);

  const scheduledAt = normalizeDateTime(payload.scheduledAt);

  ensureFutureDate(scheduledAt);

  await ensurePatientExists(patientId);
  await ensurePatientProfileCompleted(patientId);
  await ensureDoctorExists(payload.doctorId);
  await checkAppointmentConflict(payload.doctorId, scheduledAt);

  const appointmentServices = await prepareAppointmentServices(payload.services);
  const appointmentNo = await generateAppointmentNo();

  const appointment = await prisma.appointment.create({
    data: {
      appointmentNo,
      patientId,
      treatedById: payload.doctorId,
      createdById: authUser.id,
      scheduledAt,
      type: APPOINTMENT_TYPE.REGULAR,
      status: APPOINTMENT_STATUS.PENDING,
      priority: APPOINTMENT_PRIORITY.NORMAL,
      chiefComplaint: payload.chiefComplaint,
      symptoms: payload.symptoms,
      ...(appointmentServices.length > 0
        ? {
            appointmentServices: {
              create: appointmentServices,
            },
          }
        : {}),
    },
    include: appointmentInclude,
  });

  return appointment;
};

const bookEmergencyAppointment = async (
  payload: IBookEmergencyAppointmentPayload,
  authUser: User
) => {
  const patientId = await resolvePatientIdForBooking(payload.patientId, authUser);

  const scheduledAt = payload.scheduledAt ? normalizeDateTime(payload.scheduledAt) : new Date();

  await ensurePatientExists(patientId);
  await ensureDoctorExists(payload.doctorId);

  if (scheduledAt > new Date()) {
    await checkAppointmentConflict(payload.doctorId, scheduledAt);
  }

  const appointmentServices = await prepareAppointmentServices(payload.services);
  const appointmentNo = await generateAppointmentNo();

  const appointment = await prisma.appointment.create({
    data: {
      appointmentNo,
      patientId,
      treatedById: payload.doctorId,
      createdById: authUser.id,
      scheduledAt,
      type: APPOINTMENT_TYPE.EMERGENCY,
      status: APPOINTMENT_STATUS.PENDING,
      priority: APPOINTMENT_PRIORITY.URGENT,
      emergencyNote: payload.description,
      symptoms: payload.symptoms,
      ...(appointmentServices.length > 0
        ? {
            appointmentServices: {
              create: appointmentServices,
            },
          }
        : {}),
    },
    include: appointmentInclude,
  });

  return appointment;
};

const getAppointmentById = async (appointmentId: string, authUser: User) => {
  return await ensureAppointmentAccess(appointmentId, authUser);
};

const updateAppointment = async (
  appointmentId: string,
  payload: IUpdateAppointmentPayload,
  authUser: User
) => {
  const existingAppointment = await ensureAppointmentAccess(appointmentId, authUser);

  if (authUser.role === APPOINTMENT_ROLE.PATIENT) {
    if (payload.status && payload.status !== APPOINTMENT_STATUS.CANCELLED) {
      throw new AppError(status.FORBIDDEN, "Patient can only cancel own appointment");
    }

    if (payload.doctorId || payload.priority) {
      throw new AppError(status.FORBIDDEN, "Patient is not allowed to update doctor or priority");
    }
  }

  const nextDoctorId = payload.doctorId ?? existingAppointment.treatedById;

  const nextScheduledAt = payload.scheduledAt
    ? normalizeDateTime(payload.scheduledAt)
    : existingAppointment.scheduledAt;

  if (payload.scheduledAt) {
    ensureFutureDate(nextScheduledAt, "Rescheduled appointment time must be in the future");

    if (!nextDoctorId) {
      throw new AppError(status.BAD_REQUEST, "Doctor is required for rescheduling");
    }

    await ensureDoctorExists(nextDoctorId);
    await checkAppointmentConflict(nextDoctorId, nextScheduledAt, existingAppointment.id);
  }

  if (payload.doctorId && payload.doctorId !== existingAppointment.treatedById) {
    await ensureDoctorExists(payload.doctorId);
    await checkAppointmentConflict(payload.doctorId, nextScheduledAt, existingAppointment.id);
  }

  const isCancelRequest = payload.status === APPOINTMENT_STATUS.CANCELLED;

  const cleanPayload = removeUndefinedFields({
    treatedById: payload.doctorId,
    scheduledAt: payload.scheduledAt ? nextScheduledAt : undefined,
    status: isCancelRequest
      ? APPOINTMENT_STATUS.CANCELLED
      : payload.scheduledAt
        ? APPOINTMENT_STATUS.RESCHEDULED
        : payload.status,
    priority: payload.priority,
    chiefComplaint: payload.chiefComplaint,
    symptoms: payload.symptoms,
    emergencyNote: payload.emergencyNote,
    cancelReason: payload.cancelReason,
    cancelledAt: isCancelRequest ? new Date() : undefined,
  });

  if (Object.keys(cleanPayload).length === 0) {
    throw new AppError(status.BAD_REQUEST, "No valid update data provided");
  }

  const updatedAppointment = await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: cleanPayload as Prisma.AppointmentUpdateInput,
    include: appointmentInclude,
  });

  return updatedAppointment;
};

const deleteAppointment = async (appointmentId: string, authUser: User) => {
  const existingAppointment = await ensureAppointmentAccess(appointmentId, authUser);

  if (existingAppointment.status === APPOINTMENT_STATUS.COMPLETED) {
    throw new AppError(status.BAD_REQUEST, "Completed appointment cannot be cancelled");
  }

  const updatedAppointment = await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: APPOINTMENT_STATUS.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: "Appointment cancelled/deleted",
      isDeleted: true,
      deletedAt: new Date(),
    },
    include: appointmentInclude,
  });

  return updatedAppointment;
};

export const AppointmentService = {
  getAppointments,
  bookRegularAppointment,
  bookEmergencyAppointment,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
};
