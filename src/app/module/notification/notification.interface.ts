import { IQueryParams } from "../../shared/types/query.types";

export type TNotificationRole = "ADMIN" | "PATIENT" | "MANAGER";

export type TNotificationType =
  | "APPOINTMENT"
  | "EMERGENCY"
  | "REMINDER"
  | "PRESCRIPTION"
  | "INVOICE"
  | "SYSTEM";

export type TNotificationEntityType =
  | "APPOINTMENT"
  | "INVOICE"
  | "PRESCRIPTION"
  | "MEDICAL_HISTORY"
  | "CLINICAL_NOTE"
  | "TREATMENT_PLAN"
  | "PAYMENT";

export interface ICreateNotificationPayload {
  recipientId: string;
  title: string;
  message: string;
  type?: TNotificationType;
  entityType?: TNotificationEntityType | null;
  entityId?: string | null;
}

export interface IMarkNotificationsReadPayload {
  ids: string[];
}

export interface INotificationQuery extends IQueryParams {
  searchTerm?: string;
  recipientId?: string;
  type?: TNotificationType;
  entityType?: TNotificationEntityType;
  entityId?: string;
  isRead?: string | boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  fields?: string;
}
