import { IQueryParams } from "../../shared/types/query.types";

export type TAdminRole = "ADMIN" | "PATIENT" | "MANAGER";

export type TAppointmentType = "REGULAR" | "EMERGENCY";

export type TAppointmentPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type TAppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface IAdminUserQuery extends IQueryParams {
  searchTerm?: string;
  role?: TAdminRole;
  status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
  isActive?: string | boolean;
  emailVerified?: string | boolean;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  fields?: string;
}

export interface IAdminAppointmentQuery extends IQueryParams {
  searchTerm?: string;
  patientId?: string;
  treatedById?: string;
  createdById?: string;
  type?: TAppointmentType;
  status?: TAppointmentStatus;
  priority?: TAppointmentPriority;
  scheduledAtFrom?: string;
  scheduledAtTo?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  fields?: string;
}

export interface IAdminAppointmentServicePayload {
  serviceId: string;
  quantity?: number;
  notes?: string | null;
}

export interface IAdminCreateAppointmentPayload {
  patientId: string;
  doctorId: string;
  scheduledAt: string | Date;
  type?: TAppointmentType;
  priority?: TAppointmentPriority;
  chiefComplaint?: string | null;
  symptoms?: string | null;
  emergencyNote?: string | null;
  services?: IAdminAppointmentServicePayload[];
}
