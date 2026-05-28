import { z } from "zod";

const idParam = z.object({
  id: z.string().min(1, "Id is required"),
});

const createConversation = z
  .object({
    title: z.string().trim().max(150).nullable().optional(),

    type: z
      .enum(["PATIENT_SUPPORT", "AI_ASSISTANT", "APPOINTMENT_RELATED"])
      .optional()
      .default("PATIENT_SUPPORT"),

    patientId: z.string().trim().min(1).optional(),
  })
  .strict();

const sendMessage = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "Message is required")
      .max(3000, "Message must not exceed 3000 characters"),

    recipientId: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

const aiChat = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, "Message is required")
      .max(3000, "Message must not exceed 3000 characters"),

    conversationId: z.string().trim().min(1).optional(),
  })
  .strict();

const getConversationsQuery = z.object({
  searchTerm: z.string().trim().optional(),

  patientId: z.string().trim().optional(),

  type: z.enum(["PATIENT_SUPPORT", "AI_ASSISTANT", "APPOINTMENT_RELATED"]).optional(),

  page: z.union([z.string(), z.number()]).optional(),

  limit: z.union([z.string(), z.number()]).optional(),

  sortBy: z.enum(["createdAt", "updatedAt", "type", "title"]).optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  fields: z.string().trim().optional(),
});

const getMessagesQuery = z.object({
  searchTerm: z.string().trim().optional(),

  senderId: z.string().trim().optional(),

  recipientId: z.string().trim().optional(),

  senderType: z.enum(["PATIENT", "ADMIN", "MANAGER", "AI"]).optional(),

  page: z.union([z.string(), z.number()]).optional(),

  limit: z.union([z.string(), z.number()]).optional(),

  sortBy: z.enum(["sentAt", "createdAt", "updatedAt"]).optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  fields: z.string().trim().optional(),
});

export const ChatValidation = {
  idParam,
  createConversation,
  sendMessage,
  aiChat,
  getConversationsQuery,
  getMessagesQuery,
};
