import { IQueryParams } from "../../shared/types/query.types";

export type TAppointmentType = "REGULAR" | "EMERGENCY";

export type TAppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type TAppointmentPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type TUserRole = "ADMIN" | "PATIENT" | "MANAGER";

export interface IAppointmentServicePayload {
  serviceId: string;
  quantity?: number;
  notes?: string | null;
}

export interface IBookRegularAppointmentPayload {
  doctorId: string;
  scheduledAt: string | Date;
  patientId?: string;
  chiefComplaint?: string | null;
  symptoms?: string | null;
  services?: IAppointmentServicePayload[];
}

export interface IBookEmergencyAppointmentPayload {
  doctorId: string;
  patientId?: string;
  scheduledAt?: string | Date;
  description: string;
  symptoms?: string | null;
  services?: IAppointmentServicePayload[];
}

export interface IUpdateAppointmentPayload {
  doctorId?: string;
  scheduledAt?: string | Date;
  status?: TAppointmentStatus;
  priority?: TAppointmentPriority;
  chiefComplaint?: string | null;
  symptoms?: string | null;
  emergencyNote?: string | null;
  cancelReason?: string | null;
}

export interface IAppointmentQuery extends IQueryParams {
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
