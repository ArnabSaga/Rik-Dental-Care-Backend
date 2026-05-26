import { IQueryParams } from "../../shared/types/query.types";

export type TMedicalHistoryType =
  | "ALLERGY"
  | "SURGERY"
  | "DISEASE"
  | "MEDICATION"
  | "DENTAL_HISTORY"
  | "OTHER";

export interface ICreateMedicalHistoryPayload {
  title?: string | null;
  description: string;
  date: string | Date;
  type?: TMedicalHistoryType;
  allergy?: string | null;
  condition?: string | null;
  medication?: string | null;
  patientProfileId?: string;
}

export interface IUpdateMedicalHistoryPayload {
  title?: string | null;
  description?: string;
  date?: string | Date;
  type?: TMedicalHistoryType;
  allergy?: string | null;
  condition?: string | null;
  medication?: string | null;
}

export interface IMedicalHistoryQuery extends IQueryParams {
  searchTerm?: string;
  patientProfileId?: string;
  type?: TMedicalHistoryType;
  dateFrom?: string;
  dateTo?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  fields?: string;
}

export interface IMedicalHistoryAttachmentPayload {
  url: string;
  publicId?: string | null;
  fileType: "IMAGE" | "PDF" | "DOCUMENT" | "OTHER";
  resourceType?: string | null;
}
