import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";
import { paginationHelper } from "../../shared/helpers/paginationHelper";
import {
  IPatientProfileQuery,
  IUpdateDoctorProfilePayload,
  IUpdateManagerProfilePayload,
  IUpdatePatientProfilePayload,
} from "./profile.interface";
import {
  buildProfileCompletionStatus,
  calculateAge,
  isPatientProfileCompleted,
  normalizeDate,
  patientProfileInclude,
  patientProfileSortableFields,
  PROFILE_ROLE,
  removeUndefinedFields,
} from "./profile.utils";

const userBasicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  image: true,
  isActive: true,
  isDeleted: true,
} as const;

type TPatientProfileWritableFields = {
  address?: string | null;
  emergencyContact?: string | null;
  dateOfBirth?: Date | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  bloodGroup?:
    | "APLUS"
    | "AMINUS"
    | "BPLUS"
    | "BMINUS"
    | "ABPLUS"
    | "ABMINUS"
    | "OPLUS"
    | "OMINUS"
    | null;
  allergy?: string | null;
  medicalCondition?: string | null;
};

type TDoctorProfileWritableFields = {
  bmdcNumber?: string | null;
  specialty?: string | null;
  designation?: string | null;
  bio?: string | null;
  signatureUrl?: string | null;
};

type TManagerProfileWritableFields = {
  designation?: string | null;
  phone?: string | null;
};

const ensureActiveUser = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isDeleted: false,
    },
    select: userBasicSelect,
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (!user.isActive) {
    throw new AppError(status.FORBIDDEN, "User account is inactive");
  }

  return user;
};

const getPatientProfileWithAge = async (userId: string) => {
  const profile = await prisma.patientProfile.findFirst({
    where: {
      userId,
      isDeleted: false,
    },
  });

  if (!profile) return null;

  return {
    ...profile,
    age: calculateAge(profile.dateOfBirth),
  };
};

const getMyProfile = async (userId: string) => {
  const user = await ensureActiveUser(userId);

  if (user.role === PROFILE_ROLE.PATIENT) {
    const profile = await getPatientProfileWithAge(user.id);
    const isCompleted = isPatientProfileCompleted(profile);

    return {
      user,
      profile,
      completion: buildProfileCompletionStatus(user.role, isCompleted),
    };
  }

  if (user.role === PROFILE_ROLE.ADMIN) {
    const profile = await prisma.doctorProfile.findFirst({
      where: {
        userId: user.id,
        isDeleted: false,
      },
    });

    return {
      user,
      profile,
      completion: buildProfileCompletionStatus(user.role, true),
    };
  }

  if (user.role === PROFILE_ROLE.MANAGER) {
    const profile = await prisma.managerProfile.findFirst({
      where: {
        userId: user.id,
        isDeleted: false,
      },
    });

    return {
      user,
      profile,
      completion: buildProfileCompletionStatus(user.role, true),
    };
  }

  throw new AppError(status.BAD_REQUEST, "Invalid user role");
};

const upsertMyPatientProfile = async (
  userId: string,
  payload: IUpdatePatientProfilePayload,
) => {
  const user = await ensureActiveUser(userId);

  if (user.role !== PROFILE_ROLE.PATIENT) {
    throw new AppError(
      status.FORBIDDEN,
      "Only patients can update patient profile information",
    );
  }

  const cleanPayload = removeUndefinedFields({
    address: payload.address,
    emergencyContact: payload.emergencyContact,
    dateOfBirth: normalizeDate(payload.dateOfBirth),
    gender: payload.gender,
    bloodGroup: payload.bloodGroup,
    allergy: payload.allergy,
    medicalCondition: payload.medicalCondition,
  }) as TPatientProfileWritableFields;

  if (Object.keys(cleanPayload).length === 0) {
    throw new AppError(status.BAD_REQUEST, "No valid profile data provided");
  }

  const profile = await prisma.patientProfile.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      ...cleanPayload,
    },
    update: {
      ...cleanPayload,
      isDeleted: false,
      deletedAt: null,
    },
  });

  return {
    ...profile,
    age: calculateAge(profile.dateOfBirth),
    completion: buildProfileCompletionStatus(
      PROFILE_ROLE.PATIENT,
      isPatientProfileCompleted(profile),
    ),
  };
};

const upsertMyDoctorProfile = async (
  userId: string,
  payload: IUpdateDoctorProfilePayload,
) => {
  const user = await ensureActiveUser(userId);

  if (user.role !== PROFILE_ROLE.ADMIN) {
    throw new AppError(
      status.FORBIDDEN,
      "Only doctor/admin can update doctor profile",
    );
  }

  const cleanPayload = removeUndefinedFields({
    bmdcNumber: payload.bmdcNumber,
    specialty: payload.specialty,
    designation: payload.designation,
    bio: payload.bio,
    signatureUrl: payload.signatureUrl,
  }) as TDoctorProfileWritableFields;

  if (Object.keys(cleanPayload).length === 0) {
    throw new AppError(status.BAD_REQUEST, "No valid profile data provided");
  }

  return await prisma.doctorProfile.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      ...cleanPayload,
    },
    update: {
      ...cleanPayload,
      isDeleted: false,
      deletedAt: null,
    },
  });
};

const upsertMyManagerProfile = async (
  userId: string,
  payload: IUpdateManagerProfilePayload,
) => {
  const user = await ensureActiveUser(userId);

  if (user.role !== PROFILE_ROLE.MANAGER) {
    throw new AppError(
      status.FORBIDDEN,
      "Only managers can update manager profile",
    );
  }

  const cleanPayload = removeUndefinedFields({
    designation: payload.designation,
    phone: payload.phone,
  }) as TManagerProfileWritableFields;

  if (Object.keys(cleanPayload).length === 0) {
    throw new AppError(status.BAD_REQUEST, "No valid profile data provided");
  }

  return await prisma.managerProfile.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      ...cleanPayload,
    },
    update: {
      ...cleanPayload,
      isDeleted: false,
      deletedAt: null,
    },
  });
};

const buildPatientProfileWhere = (
  query: IPatientProfileQuery,
): Prisma.PatientProfileWhereInput => {
  const where: Prisma.PatientProfileWhereInput = {
    isDeleted: false,
    user: {
      is: {
        isDeleted: false,
      },
    },
  };

  if (query.gender) {
    where.gender = query.gender;
  }

  if (query.bloodGroup) {
    where.bloodGroup = query.bloodGroup;
  }

  if (query.searchTerm) {
    where.OR = [
      {
        address: {
          contains: query.searchTerm,
          mode: "insensitive",
        },
      },
      {
        emergencyContact: {
          contains: query.searchTerm,
          mode: "insensitive",
        },
      },
      {
        allergy: {
          contains: query.searchTerm,
          mode: "insensitive",
        },
      },
      {
        medicalCondition: {
          contains: query.searchTerm,
          mode: "insensitive",
        },
      },
      {
        user: {
          is: {
            name: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
      },
      {
        user: {
          is: {
            email: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
      },
      {
        user: {
          is: {
            phone: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  return where;
};

const getAllPatientProfiles = async (query: IPatientProfileQuery) => {
  const pagination = paginationHelper.calculatePagination(query, {
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultLimit: 10,
    maxLimit: 100,
  });

  const safeSortBy = patientProfileSortableFields.includes(pagination.sortBy)
    ? pagination.sortBy
    : "createdAt";

  const where = buildPatientProfileWhere(query);

  const [total, data] = await Promise.all([
    prisma.patientProfile.count({
      where,
    }),

    prisma.patientProfile.findMany({
      where,
      include: patientProfileInclude,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: {
        [safeSortBy]: pagination.sortOrder,
      } as Prisma.PatientProfileOrderByWithRelationInput,
    }),
  ]);

  return {
    data: data.map((profile) => ({
      ...profile,
      age: calculateAge(profile.dateOfBirth),
    })),
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

const getPatientProfileById = async (id: string) => {
  const profile = await prisma.patientProfile.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    include: patientProfileInclude,
  });

  if (!profile) {
    throw new AppError(status.NOT_FOUND, "Patient profile not found");
  }

  return {
    ...profile,
    age: calculateAge(profile.dateOfBirth),
  };
};

const getPatientProfileByUserId = async (userId: string) => {
  const profile = await prisma.patientProfile.findFirst({
    where: {
      userId,
      isDeleted: false,
      user: {
        is: {
          isDeleted: false,
        },
      },
    },
    include: patientProfileInclude,
  });

  if (!profile) {
    throw new AppError(status.NOT_FOUND, "Patient profile not found");
  }

  return {
    ...profile,
    age: calculateAge(profile.dateOfBirth),
  };
};

export const ProfileService = {
  getMyProfile,
  upsertMyPatientProfile,
  upsertMyDoctorProfile,
  upsertMyManagerProfile,
  getAllPatientProfiles,
  getPatientProfileById,
  getPatientProfileByUserId,
};
