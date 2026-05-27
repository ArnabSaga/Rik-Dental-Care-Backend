import { IQueryParams } from "../../shared/types/query.types";

export type TPrescriptionUserRole = "ADMIN" | "PATIENT" | "MANAGER";

export interface IPrescriptionItemPayload {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string | null;
}

export interface ICreatePrescriptionPayload {
  appointmentId: string;
  notes?: string | null;
  pdfUrl?: string | null;
  items: IPrescriptionItemPayload[];
}

export interface IUpdatePrescriptionPayload {
  notes?: string | null;
  pdfUrl?: string | null;
  items?: IPrescriptionItemPayload[];
}

export interface IPrescriptionQuery extends IQueryParams {
  searchTerm?: string;
  appointmentId?: string;
  createdById?: string;
  updatedById?: string;
  patientId?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  fields?: string;
}
