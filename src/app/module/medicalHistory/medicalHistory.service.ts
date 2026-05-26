import status from "http-status";
import { Prisma, User } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";
import { QueryBuilder } from "../../shared/helpers/queryHelper";
import {
  ICreateMedicalHistoryPayload,
  IMedicalHistoryQuery,
  IUpdateMedicalHistoryPayload,
} from "./medicalHistory.interface";
import {
  MEDICAL_HISTORY_ROLE,
  MEDICAL_HISTORY_TYPE,
  getAttachmentTypeFromMime,
  getMedicalHistoryDateRangeWhere,
  getUploadedFilePublicId,
  getUploadedFileUrl,
  medicalHistoryFilterableFields,
  medicalHistoryInclude,
  medicalHistorySearchableFields,
  medicalHistorySelectableFields,
  medicalHistorySortableFields,
  normalizeDate,
  removeUndefinedFields,
} from "./medicalHistory.utils";

const ensurePatientProfileForUser = async (userId: string) => {
  const profile = await prisma.patientProfile.findFirst({
    where: {
      userId,
      isDeleted: false,
      user: {
        is: {
          isDeleted: false,
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!profile) {
    throw new AppError(
      status.BAD_REQUEST,
      "Patient profile is required before adding medical history"
    );
  }

  return profile;
};

const ensurePatientProfileExists = async (patientProfileId: string) => {
  const profile = await prisma.patientProfile.findFirst({
    where: {
      id: patientProfileId,
      isDeleted: false,
      user: {
        is: {
          isDeleted: false,
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!profile) {
    throw new AppError(status.NOT_FOUND, "Patient profile not found");
  }

  return profile;
};

const resolvePatientProfileIdForCreate = async (
  payloadPatientProfileId: string | undefined,
  authUser: User
): Promise<string> => {
  if (authUser.role === MEDICAL_HISTORY_ROLE.PATIENT) {
    if (payloadPatientProfileId) {
      const profile = await ensurePatientProfileExists(payloadPatientProfileId);

      if (profile.userId !== authUser.id) {
        throw new AppError(status.FORBIDDEN, "Patient can only create own medical history");
      }

      return profile.id;
    }

    const ownProfile = await ensurePatientProfileForUser(authUser.id);
    return ownProfile.id;
  }

  if (
    authUser.role === MEDICAL_HISTORY_ROLE.ADMIN ||
    authUser.role === MEDICAL_HISTORY_ROLE.MANAGER
  ) {
    if (!payloadPatientProfileId) {
      throw new AppError(status.BAD_REQUEST, "patientProfileId is required for admin/manager");
    }

    const profile = await ensurePatientProfileExists(payloadPatientProfileId);
    return profile.id;
  }

  throw new AppError(status.FORBIDDEN, "You are not allowed to create medical history");
};

const ensureMedicalHistoryAccess = async (medicalHistoryId: string, authUser: User) => {
  const medicalHistory = await prisma.medicalHistory.findFirst({
    where: {
      id: medicalHistoryId,
      isDeleted: false,
    },
    include: medicalHistoryInclude,
  });

  if (!medicalHistory) {
    throw new AppError(status.NOT_FOUND, "Medical history not found");
  }

  const patientUserId = medicalHistory.patientProfile.userId;

  const canAccess =
    authUser.role === MEDICAL_HISTORY_ROLE.ADMIN ||
    authUser.role === MEDICAL_HISTORY_ROLE.MANAGER ||
    patientUserId === authUser.id;

  if (!canAccess) {
    throw new AppError(status.FORBIDDEN, "You are not allowed to access this medical history");
  }

  return medicalHistory;
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

const getMedicalHistories = async (query: IMedicalHistoryQuery, authUser: User) => {
  const baseWhere: Prisma.MedicalHistoryWhereInput = {
    isDeleted: false,
    ...getMedicalHistoryDateRangeWhere(query),
  };

  if (authUser.role === MEDICAL_HISTORY_ROLE.PATIENT) {
    const ownProfile = await ensurePatientProfileForUser(authUser.id);
    baseWhere.patientProfileId = ownProfile.id;
  }

  const safeQuery = {
    ...query,
  };

  delete safeQuery.dateFrom;
  delete safeQuery.dateTo;

  if (authUser.role === MEDICAL_HISTORY_ROLE.PATIENT) {
    delete safeQuery.patientProfileId;
  }

  const queryBuilder = new QueryBuilder(prisma.medicalHistory, safeQuery, {
    searchableFields: medicalHistorySearchableFields,
    filterableFields: medicalHistoryFilterableFields,
    sortableFields: medicalHistorySortableFields,
    selectableFields: medicalHistorySelectableFields,
    dateFields: ["date", "createdAt", "updatedAt"],
    defaultSortBy: "date",
    defaultSortOrder: "desc",
    defaultLimit: 10,
    maxLimit: 100,
  });

  const result = await queryBuilder
    .where(baseWhere)
    .include(medicalHistoryInclude)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();

  return result;
};

const createMedicalHistory = async (
  payload: ICreateMedicalHistoryPayload,
  authUser: User,
  file?: Express.Multer.File
) => {
  const patientProfileId = await resolvePatientProfileIdForCreate(
    payload.patientProfileId,
    authUser
  );

  const attachmentPayload = buildAttachmentCreatePayload(file);

  const medicalHistory = await prisma.medicalHistory.create({
    data: {
      title: payload.title,
      description: payload.description,
      date: normalizeDate(payload.date),
      type: payload.type ?? MEDICAL_HISTORY_TYPE.OTHER,
      allergy: payload.allergy,
      condition: payload.condition,
      medication: payload.medication,
      patientProfileId,
      ...(attachmentPayload
        ? {
            attachments: {
              create: attachmentPayload,
            },
          }
        : {}),
    },
    include: medicalHistoryInclude,
  });

  return medicalHistory;
};

const getMedicalHistoryById = async (medicalHistoryId: string, authUser: User) => {
  return await ensureMedicalHistoryAccess(medicalHistoryId, authUser);
};

const updateMedicalHistory = async (
  medicalHistoryId: string,
  payload: IUpdateMedicalHistoryPayload,
  authUser: User,
  file?: Express.Multer.File
) => {
  await ensureMedicalHistoryAccess(medicalHistoryId, authUser);

  const attachmentPayload = buildAttachmentCreatePayload(file);

  const cleanPayload = removeUndefinedFields({
    title: payload.title,
    description: payload.description,
    date: payload.date ? normalizeDate(payload.date) : undefined,
    type: payload.type,
    allergy: payload.allergy,
    condition: payload.condition,
    medication: payload.medication,
  });

  if (Object.keys(cleanPayload).length === 0 && !attachmentPayload) {
    throw new AppError(status.BAD_REQUEST, "No valid update data provided");
  }

  const updatedMedicalHistory = await prisma.medicalHistory.update({
    where: {
      id: medicalHistoryId,
    },
    data: {
      ...(cleanPayload as Prisma.MedicalHistoryUpdateInput),
      ...(attachmentPayload
        ? {
            attachments: {
              create: attachmentPayload,
            },
          }
        : {}),
    },
    include: medicalHistoryInclude,
  });

  return updatedMedicalHistory;
};

const deleteMedicalHistory = async (medicalHistoryId: string, authUser: User) => {
  await ensureMedicalHistoryAccess(medicalHistoryId, authUser);

  const deletedMedicalHistory = await prisma.medicalHistory.update({
    where: {
      id: medicalHistoryId,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
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
    include: medicalHistoryInclude,
  });

  return deletedMedicalHistory;
};

export const MedicalHistoryService = {
  getMedicalHistories,
  createMedicalHistory,
  getMedicalHistoryById,
  updateMedicalHistory,
  deleteMedicalHistory,
};
