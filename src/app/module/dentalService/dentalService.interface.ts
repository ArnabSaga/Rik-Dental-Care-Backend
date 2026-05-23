import { IQueryParams } from "../../shared/types/query.types";

export interface ICreateDentalServicePayload {
  name: string;
  description?: string | null;
  basePrice: number;
  slug?: string;
  isActive?: boolean;
}

export interface IUpdateDentalServicePayload {
  name?: string;
  description?: string | null;
  basePrice?: number;
  slug?: string;
  isActive?: boolean;
}

export interface IDentalServiceQuery extends IQueryParams {
  searchTerm?: string;
  isActive?: string | boolean;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  fields?: string;
}

export interface IUpdateDentalServiceStatusPayload {
  isActive: boolean;
}
