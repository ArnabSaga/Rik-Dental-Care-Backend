import status from "http-status";
import AppError from "../../shared/errors/AppError";

export const CHAT_ROLE = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  MANAGER: "MANAGER",
} as const;

export const CONVERSATION_TYPE = {
  PATIENT_SUPPORT: "PATIENT_SUPPORT",
  AI_ASSISTANT: "AI_ASSISTANT",
  APPOINTMENT_RELATED: "APPOINTMENT_RELATED",
} as const;

export const CHAT_SENDER_TYPE = {
  PATIENT: "PATIENT",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  AI: "AI",
} as const;

export const conversationSearchableFields = ["title"];

export const conversationFilterableFields = ["patientId", "type"];

export const conversationSortableFields = ["createdAt", "updatedAt", "type", "title"];

export const conversationSelectableFields = [
  "id",
  "title",
  "type",
  "patientId",
  "createdAt",
  "updatedAt",
];

export const messageSearchableFields = ["content"];

export const messageFilterableFields = ["senderId", "recipientId", "senderType"];

export const messageSortableFields = ["sentAt", "createdAt", "updatedAt"];

export const messageSelectableFields = [
  "id",
  "conversationId",
  "senderId",
  "recipientId",
  "content",
  "senderType",
  "sentAt",
  "readAt",
  "createdAt",
  "updatedAt",
];

export const conversationInclude = {
  patient: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      status: true,
      isActive: true,
    },
  },
  messages: {
    where: {
      isDeleted: false,
    },
    orderBy: {
      sentAt: "desc" as const,
    },
    take: 1,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      },
      recipient: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      },
    },
  },
};

export const conversationDetailsInclude = {
  patient: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      status: true,
      isActive: true,
    },
  },
};

export const messageInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
    },
  },
  recipient: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
    },
  },
  conversation: {
    select: {
      id: true,
      title: true,
      type: true,
      patientId: true,
    },
  },
};

export const getParamId = (id: string | string[] | undefined): string => {
  if (!id || Array.isArray(id)) {
    throw new AppError(status.BAD_REQUEST, "Valid id is required");
  }

  return id;
};

export const removeUndefinedFields = <T extends Record<string, unknown>>(
  payload: T
): Partial<T> => {
  const cleanPayload: Partial<T> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanPayload[key as keyof T] = value as T[keyof T];
    }
  });

  return cleanPayload;
};

export const resolveSenderType = (role: string): "PATIENT" | "ADMIN" | "MANAGER" => {
  if (role === CHAT_ROLE.ADMIN) {
    return CHAT_SENDER_TYPE.ADMIN;
  }

  if (role === CHAT_ROLE.MANAGER) {
    return CHAT_SENDER_TYPE.MANAGER;
  }

  return CHAT_SENDER_TYPE.PATIENT;
};

export const buildAiSafeReply = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("pain") ||
    lowerMessage.includes("swelling") ||
    lowerMessage.includes("bleeding") ||
    lowerMessage.includes("emergency")
  ) {
    return "I’m sorry you are experiencing this. If you have severe pain, swelling, bleeding, fever, trauma, or difficulty swallowing, please contact Rik Dental Care Center immediately or seek urgent medical care. I can help you book an emergency appointment.";
  }

  if (
    lowerMessage.includes("appointment") ||
    lowerMessage.includes("book") ||
    lowerMessage.includes("schedule")
  ) {
    return "You can book a regular appointment from the appointment section. For urgent dental pain or swelling, please choose emergency appointment.";
  }

  if (
    lowerMessage.includes("invoice") ||
    lowerMessage.includes("bill") ||
    lowerMessage.includes("payment")
  ) {
    return "You can view your invoice from the invoice section after your appointment is completed or after the clinic issues the invoice.";
  }

  if (lowerMessage.includes("prescription") || lowerMessage.includes("medicine")) {
    return "You can view your prescription from the prescription section after the doctor issues it. Please do not take medicine without professional guidance.";
  }

  return "Thank you for contacting Rik Dental Care Center. I can help with appointment guidance, invoice or prescription navigation, and general clinic support. For medical diagnosis or urgent symptoms, please consult the doctor directly.";
};
