import { IQueryParams } from "../../shared/types/query.types";

export type TProfileRole = "ADMIN" | "PATIENT" | "MANAGER";
export type TGender = "MALE" | "FEMALE" | "OTHER";

export type TBloodGroup =
  | "APLUS"
  | "AMINUS"
  | "BPLUS"
  | "BMINUS"
  | "ABPLUS"
  | "ABMINUS"
  | "OPLUS"
  | "OMINUS";

export interface IUpdatePatientProfilePayload {
  address?: string | null;
  emergencyContact?: string | null;
  dateOfBirth?: string | Date | null;
  gender?: TGender | null;
  bloodGroup?: TBloodGroup | null;
  allergy?: string | null;
  medicalCondition?: string | null;
}

export interface IUpdateDoctorProfilePayload {
  bmdcNumber?: string | null;
  specialty?: string | null;
  designation?: string | null;
  bio?: string | null;
  signatureUrl?: string | null;
}

export interface IUpdateManagerProfilePayload {
  designation?: string | null;
  phone?: string | null;
}

export interface IPatientProfileQuery extends IQueryParams {
  searchTerm?: string;
  gender?: TGender;
  bloodGroup?: TBloodGroup;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  fields?: string;
}

export interface IProfileCompletionStatus {
  role: TProfileRole;
  isProfileRequired: boolean;
  isProfileCompleted: boolean;
  shouldRedirectToProfile: boolean;
}
