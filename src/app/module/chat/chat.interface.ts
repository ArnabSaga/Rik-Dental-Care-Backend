import { IQueryParams } from "../../shared/types/query.types";

export type TChatUserRole = "ADMIN" | "PATIENT" | "MANAGER";

export type TConversationType =
  | "PATIENT_SUPPORT"
  | "AI_ASSISTANT"
  | "APPOINTMENT_RELATED";

export type TChatSenderType = "PATIENT" | "ADMIN" | "MANAGER" | "AI";

export interface ICreateConversationPayload {
  title?: string | null;
  type?: TConversationType;
  patientId?: string;
}

export interface ISendMessagePayload {
  content: string;
  recipientId?: string | null;
}

export interface IAiChatPayload {
  message: string;
  conversationId?: string;
}

export interface IConversationQuery extends IQueryParams {
  searchTerm?: string;
  patientId?: string;
  type?: TConversationType;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  fields?: string;
}

export interface IMessageQuery extends IQueryParams {
  searchTerm?: string;
  senderId?: string;
  recipientId?: string;
  senderType?: TChatSenderType;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  fields?: string;
}
