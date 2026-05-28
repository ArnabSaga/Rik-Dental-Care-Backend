import type { InvoiceStatus } from "../../../generated/prisma/client";
import { IQueryParams } from "../../shared/types/query.types";

export type TInvoiceUserRole = "ADMIN" | "PATIENT" | "MANAGER";

export type TInvoiceStatus = InvoiceStatus;

export interface IInvoiceItemPayload {
  serviceId?: string | null;
  serviceName: string;
  description?: string | null;
  quantity?: number;
  unitPrice: number;
  discountAmount?: number;
}

export interface ICreateInvoicePayload {
  appointmentId: string;
  dueDate?: string | Date | null;
  discountAmount?: number;
  taxAmount?: number;
  status?: TInvoiceStatus;
  pdfUrl?: string | null;
  items?: IInvoiceItemPayload[];
}

export interface IUpdateInvoicePayload {
  dueDate?: string | Date | null;
  discountAmount?: number;
  taxAmount?: number;
  paidAmount?: number;
  status?: TInvoiceStatus;
  pdfUrl?: string | null;
  items?: IInvoiceItemPayload[];
}

export interface IInvoiceQuery extends IQueryParams {
  searchTerm?: string;
  appointmentId?: string;
  issuedById?: string;
  patientId?: string;
  status?: TInvoiceStatus;
  dueDateFrom?: string;
  dueDateTo?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  fields?: string;
}
