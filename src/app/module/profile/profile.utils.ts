import status from "http-status";
import AppError from "../../shared/errors/AppError";

export const PROFILE_ROLE = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  MANAGER: "MANAGER",
} as const;

export const GENDER = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;

export const BLOOD_GROUP = {
  APLUS: "APLUS",
  AMINUS: "AMINUS",
  BPLUS: "BPLUS",
  BMINUS: "BMINUS",
  ABPLUS: "ABPLUS",
  ABMINUS: "ABMINUS",
  OPLUS: "OPLUS",
  OMINUS: "OMINUS",
} as const;

export const patientProfileFilterableFields = ["gender", "bloodGroup"];

export const patientProfileSortableFields = [
  "createdAt",
  "updatedAt",
  "dateOfBirth",
  "gender",
  "bloodGroup",
];

export const patientProfileInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      status: true,
      isActive: true,
    },
  },
};

export const getParamId = (id: string | string[] | undefined): string => {
  if (!id || Array.isArray(id)) {
    throw new AppError(status.BAD_REQUEST, "Valid id is required");
  }

  return id;
};

export const calculateAge = (dateOfBirth?: Date | string | null): number | null => {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  const hasBirthdayPassedThisYear =
    monthDifference > 0 || (monthDifference === 0 && today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassedThisYear) {
    age -= 1;
  }

  return age;
};

export const normalizeDate = (date?: string | Date | null): Date | null | undefined => {
  if (date === undefined) return undefined;
  if (date === null) return null;

  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(status.BAD_REQUEST, "Invalid date of birth");
  }

  const today = new Date();

  if (parsedDate > today) {
    throw new AppError(status.BAD_REQUEST, "Date of birth cannot be in the future");
  }

  return parsedDate;
};

export const removeUndefinedFields = <T extends Record<string, unknown>>(
  payload: T
): Partial<T> => {
  const cleanPayload: Partial<T> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanPayload[key as keyof T] = value as T[keyof T];
    }
  });

  return cleanPayload;
};

export const isPatientProfileCompleted = (
  profile: {
    address?: string | null;
    emergencyContact?: string | null;
    dateOfBirth?: Date | string | null;
    gender?: string | null;
    bloodGroup?: string | null;
  } | null
): boolean => {
  if (!profile) return false;

  return Boolean(
    profile.address &&
    profile.emergencyContact &&
    profile.dateOfBirth &&
    profile.gender &&
    profile.bloodGroup
  );
};

export const buildProfileCompletionStatus = (
  role: "ADMIN" | "PATIENT" | "MANAGER",
  isCompleted: boolean
) => {
  const isProfileRequired = role === PROFILE_ROLE.PATIENT;

  return {
    role,
    isProfileRequired,
    isProfileCompleted: role === PROFILE_ROLE.PATIENT ? isCompleted : true,
    shouldRedirectToProfile: role === PROFILE_ROLE.PATIENT && !isCompleted,
  };
};
