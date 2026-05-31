import status from "http-status";
import { Prisma, User } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";
import { QueryBuilder } from "../../shared/helpers/queryHelper";
import {
  ICreatePrescriptionPayload,
  IPrescriptionItemPayload,
  IPrescriptionQuery,
  IUpdatePrescriptionPayload,
} from "./prescription.interface";
import {
  PRESCRIPTION_APPOINTMENT_STATUS,
  PRESCRIPTION_ROLE,
  getAttachmentTypeFromMime,
  getPrescriptionCreatedAtRangeWhere,
  getUploadedFilePublicId,
  getUploadedFileUrl,
  prescriptionFilterableFields,
  prescriptionInclude,
  prescriptionSearchableFields,
  prescriptionSelectableFields,
  prescriptionSortableFields,
  removeUndefinedFields,
} from "./prescription.utils";

const ensureAppointmentForPrescription = async (appointmentId: string) => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      isDeleted: false,
      status: {
        notIn: [
          PRESCRIPTION_APPOINTMENT_STATUS.CANCELLED,
          PRESCRIPTION_APPOINTMENT_STATUS.NO_SHOW,
        ],
      },
      patient: {
        is: {
          isDeleted: false,
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      patientId: true,
      treatedById: true,
      appointmentNo: true,
      status: true,
    },
  });

  if (!appointment) {
    throw new AppError(
      status.NOT_FOUND,
      "Valid appointment not found for prescription",
    );
  }

  return appointment;
};

const ensurePrescriptionAccess = async (
  prescriptionId: string,
  authUser: User,
) => {
  const prescription = await prisma.prescription.findFirst({
    where: {
      id: prescriptionId,
      isDeleted: false,
    },
    include: prescriptionInclude,
  });

  if (!prescription) {
    throw new AppError(status.NOT_FOUND, "Prescription not found");
  }

  const patientId = prescription.appointment.patientId;

  const canAccess =
    authUser.role === PRESCRIPTION_ROLE.ADMIN ||
    authUser.role === PRESCRIPTION_ROLE.MANAGER ||
    patientId === authUser.id;

  if (!canAccess) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not allowed to access this prescription",
    );
  }

  return prescription;
};

const buildPrescriptionItemsCreatePayload = (
  items: IPrescriptionItemPayload[],
) => {
  return items.map((item) => ({
    medicineName: item.medicineName,
    dosage: item.dosage,
    frequency: item.frequency,
    duration: item.duration,
    instructions: item.instructions,
  }));
};

const buildAttachmentCreatePayload = (file?: Express.Multer.File) => {
  const fileUrl = getUploadedFileUrl(file);

  if (!file || !fileUrl) return undefined;

  return {
    url: fileUrl,
    publicId: getUploadedFilePublicId(file),
    fileType: getAttachmentTypeFromMime(file.mimetype),
    resourceType: file.mimetype,
  };
};

const getPrescriptions = async (query: IPrescriptionQuery, authUser: User) => {
  const baseWhere: Prisma.PrescriptionWhereInput = {
    isDeleted: false,
    ...getPrescriptionCreatedAtRangeWhere(query),
  };

  if (authUser.role === PRESCRIPTION_ROLE.PATIENT) {
    baseWhere.appointment = {
      is: {
        patientId: authUser.id,
        isDeleted: false,
      },
    };
  }

  if (authUser.role !== PRESCRIPTION_ROLE.PATIENT && query.patientId) {
    baseWhere.appointment = {
      is: {
        patientId: query.patientId,
        isDeleted: false,
      },
    };
  }

  const safeQuery = {
    ...query,
  };

  delete safeQuery.createdAtFrom;
  delete safeQuery.createdAtTo;
  delete safeQuery.patientId;

  const queryBuilder = new QueryBuilder(prisma.prescription, safeQuery, {
    searchableFields: prescriptionSearchableFields,
    filterableFields: prescriptionFilterableFields,
    sortableFields: prescriptionSortableFields,
    selectableFields: prescriptionSelectableFields,
    dateFields: ["createdAt", "updatedAt"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultLimit: 10,
    maxLimit: 100,
  });

  const result = await queryBuilder
    .where(baseWhere)
    .include(prescriptionInclude)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();

  return result;
};

const createPrescription = async (
  payload: ICreatePrescriptionPayload,
  authUser: User,
  file?: Express.Multer.File,
) => {
  if (authUser.role !== PRESCRIPTION_ROLE.ADMIN) {
    throw new AppError(
      status.FORBIDDEN,
      "Only doctor/admin can create prescription",
    );
  }

  await ensureAppointmentForPrescription(payload.appointmentId);

  const existingPrescription = await prisma.prescription.findFirst({
    where: {
      appointmentId: payload.appointmentId,
      isDeleted: false,
    },
    select: {
      id: true,
    },
  });

  if (existingPrescription) {
    throw new AppError(
      status.CONFLICT,
      "Prescription already exists for this appointment",
    );
  }

  const attachmentPayload = buildAttachmentCreatePayload(file);

  const prescription = await prisma.prescription.create({
    data: {
      appointmentId: payload.appointmentId,
      notes: payload.notes,
      pdfUrl: payload.pdfUrl,
      createdById: authUser.id,
      items: {
        create: buildPrescriptionItemsCreatePayload(payload.items),
      },
      ...(attachmentPayload
        ? {
            attachments: {
              create: attachmentPayload,
            },
          }
        : {}),
    },
    include: prescriptionInclude,
  });

  return prescription;
};

const getPrescriptionById = async (prescriptionId: string, authUser: User) => {
  return await ensurePrescriptionAccess(prescriptionId, authUser);
};

const getPrescriptionByAppointmentId = async (
  appointmentId: string,
  authUser: User,
) => {
  const prescription = await prisma.prescription.findFirst({
    where: {
      appointmentId,
      isDeleted: false,
    },
    include: prescriptionInclude,
  });

  if (!prescription) {
    throw new AppError(status.NOT_FOUND, "Prescription not found");
  }

  const patientId = prescription.appointment.patientId;

  const canAccess =
    authUser.role === PRESCRIPTION_ROLE.ADMIN ||
    authUser.role === PRESCRIPTION_ROLE.MANAGER ||
    patientId === authUser.id;

  if (!canAccess) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not allowed to access this prescription",
    );
  }

  return prescription;
};

const updatePrescription = async (
  prescriptionId: string,
  payload: IUpdatePrescriptionPayload,
  authUser: User,
  file?: Express.Multer.File,
) => {
  if (authUser.role !== PRESCRIPTION_ROLE.ADMIN) {
    throw new AppError(
      status.FORBIDDEN,
      "Only doctor/admin can update prescription",
    );
  }

  await ensurePrescriptionAccess(prescriptionId, authUser);

  const attachmentPayload = buildAttachmentCreatePayload(file);

  const cleanPayload = removeUndefinedFields({
    notes: payload.notes,
    pdfUrl: payload.pdfUrl,
    updatedById: authUser.id,
  });

  if (
    Object.keys(cleanPayload).length === 1 &&
    cleanPayload.updatedById &&
    !payload.items &&
    !attachmentPayload
  ) {
    throw new AppError(status.BAD_REQUEST, "No valid update data provided");
  }

  const updatedPrescription = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      if (payload.items) {
        await tx.prescriptionItem.deleteMany({
          where: {
            prescriptionId,
          },
        });
      }

      return await tx.prescription.update({
        where: {
          id: prescriptionId,
        },
        data: {
          ...(cleanPayload as Prisma.PrescriptionUpdateInput),
          ...(payload.items
            ? {
                items: {
                  create: buildPrescriptionItemsCreatePayload(payload.items),
                },
              }
            : {}),
          ...(attachmentPayload
            ? {
                attachments: {
                  create: attachmentPayload,
                },
              }
            : {}),
        },
        include: prescriptionInclude,
      });
    },
  );

  return updatedPrescription;
};

const deletePrescription = async (prescriptionId: string, authUser: User) => {
  if (authUser.role !== PRESCRIPTION_ROLE.ADMIN) {
    throw new AppError(
      status.FORBIDDEN,
      "Only doctor/admin can delete prescription",
    );
  }

  await ensurePrescriptionAccess(prescriptionId, authUser);

  const deletedPrescription = await prisma.prescription.update({
    where: {
      id: prescriptionId,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      updatedById: authUser.id,
      attachments: {
        updateMany: {
          where: {
            isDeleted: false,
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        },
      },
    },
    include: prescriptionInclude,
  });

  return deletedPrescription;
};

export const PrescriptionService = {
  getPrescriptions,
  createPrescription,
  getPrescriptionById,
  getPrescriptionByAppointmentId,
  updatePrescription,
  deletePrescription,
};
