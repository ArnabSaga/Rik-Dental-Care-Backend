import status from "http-status";
import { Prisma, User } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";
import { QueryBuilder } from "../../shared/helpers/queryHelper";
import {
  IAiChatPayload,
  IConversationQuery,
  ICreateConversationPayload,
  IMessageQuery,
  ISendMessagePayload,
} from "./chat.interface";

import {
  buildAiSafeReply,
  CHAT_ROLE,
  CHAT_SENDER_TYPE,
  CONVERSATION_TYPE,
  conversationDetailsInclude,
  conversationFilterableFields,
  conversationInclude,
  conversationSearchableFields,
  conversationSelectableFields,
  conversationSortableFields,
  messageFilterableFields,
  messageInclude,
  messageSearchableFields,
  messageSelectableFields,
  messageSortableFields,
  resolveSenderType,
} from "./chat.utils";

const ensurePatientExists = async (patientId: string) => {
  const patient = await prisma.user.findFirst({
    where: {
      id: patientId,
      role: CHAT_ROLE.PATIENT,
      isActive: true,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!patient) {
    throw new AppError(status.NOT_FOUND, "Patient not found or inactive");
  }

  return patient;
};

const ensureUserExists = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isActive: true,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found or inactive");
  }

  return user;
};

const resolveConversationPatientId = async (
  payloadPatientId: string | undefined,
  authUser: User
): Promise<string | undefined> => {
  if (authUser.role === CHAT_ROLE.PATIENT) {
    if (payloadPatientId && payloadPatientId !== authUser.id) {
      throw new AppError(status.FORBIDDEN, "Patient can only create own conversation");
    }

    return authUser.id;
  }

  if (authUser.role === CHAT_ROLE.ADMIN || authUser.role === CHAT_ROLE.MANAGER) {
    if (!payloadPatientId) {
      return undefined;
    }

    await ensurePatientExists(payloadPatientId);
    return payloadPatientId;
  }

  throw new AppError(status.FORBIDDEN, "You are not allowed to create conversation");
};

const ensureConversationAccess = async (conversationId: string, authUser: User) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      isDeleted: false,
    },
    include: conversationDetailsInclude,
  });

  if (!conversation) {
    throw new AppError(status.NOT_FOUND, "Conversation not found");
  }

  const canAccess =
    authUser.role === CHAT_ROLE.ADMIN ||
    authUser.role === CHAT_ROLE.MANAGER ||
    conversation.patientId === authUser.id;

  if (!canAccess) {
    throw new AppError(status.FORBIDDEN, "You are not allowed to access this conversation");
  }

  return conversation;
};

const ensureMessageAccess = async (messageId: string, authUser: User) => {
  const message = await prisma.chatMessage.findFirst({
    where: {
      id: messageId,
      isDeleted: false,
    },
    include: messageInclude,
  });

  if (!message) {
    throw new AppError(status.NOT_FOUND, "Message not found");
  }

  const conversation = await ensureConversationAccess(message.conversationId, authUser);

  return {
    message,
    conversation,
  };
};

const getConversations = async (query: IConversationQuery, authUser: User) => {
  const baseWhere: Prisma.ConversationWhereInput = {
    isDeleted: false,
  };

  if (authUser.role === CHAT_ROLE.PATIENT) {
    baseWhere.patientId = authUser.id;
  }

  const safeQuery = {
    ...query,
  };

  if (authUser.role === CHAT_ROLE.PATIENT) {
    delete safeQuery.patientId;
  }

  const queryBuilder = new QueryBuilder(prisma.conversation, safeQuery, {
    searchableFields: conversationSearchableFields,
    filterableFields: conversationFilterableFields,
    sortableFields: conversationSortableFields,
    selectableFields: conversationSelectableFields,
    defaultSortBy: "updatedAt",
    defaultSortOrder: "desc",
    defaultLimit: 10,
    maxLimit: 100,
  });

  const result = await queryBuilder
    .where(baseWhere)
    .include(conversationInclude)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();

  return result;
};

const createConversation = async (payload: ICreateConversationPayload, authUser: User) => {
  const patientId = await resolveConversationPatientId(payload.patientId, authUser);

  const conversation = await prisma.conversation.create({
    data: {
      title: payload.title,
      type: payload.type ?? CONVERSATION_TYPE.PATIENT_SUPPORT,
      patientId,
    },
    include: conversationDetailsInclude,
  });

  return conversation;
};

const getConversationById = async (conversationId: string, authUser: User) => {
  const conversation = await ensureConversationAccess(conversationId, authUser);

  return conversation;
};

const deleteConversation = async (conversationId: string, authUser: User) => {
  await ensureConversationAccess(conversationId, authUser);

  const deletedConversation = await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      messages: {
        updateMany: {
          where: {
            isDeleted: false,
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        },
      },
    },
    include: conversationDetailsInclude,
  });

  return deletedConversation;
};

const getMessages = async (conversationId: string, query: IMessageQuery, authUser: User) => {
  await ensureConversationAccess(conversationId, authUser);

  const queryBuilder = new QueryBuilder(prisma.chatMessage, query, {
    searchableFields: messageSearchableFields,
    filterableFields: messageFilterableFields,
    sortableFields: messageSortableFields,
    selectableFields: messageSelectableFields,
    defaultSortBy: "sentAt",
    defaultSortOrder: "asc",
    defaultLimit: 50,
    maxLimit: 100,
  });

  const result = await queryBuilder
    .where({
      conversationId,
      isDeleted: false,
    })
    .include(messageInclude)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();

  return result;
};

const sendMessage = async (
  conversationId: string,
  payload: ISendMessagePayload,
  authUser: User
) => {
  const conversation = await ensureConversationAccess(conversationId, authUser);

  if (payload.recipientId) {
    await ensureUserExists(payload.recipientId);
  }

  const defaultRecipientId = authUser.role === CHAT_ROLE.PATIENT ? null : conversation.patientId;

  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId: authUser.id,
      recipientId: payload.recipientId ?? defaultRecipientId,
      content: payload.content,
      senderType: resolveSenderType(authUser.role),
    },
    include: messageInclude,
  });

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  return message;
};

const markMessageAsRead = async (messageId: string, authUser: User) => {
  const { message, conversation } = await ensureMessageAccess(messageId, authUser);

  const canMark =
    authUser.role === CHAT_ROLE.ADMIN ||
    authUser.role === CHAT_ROLE.MANAGER ||
    message.recipientId === authUser.id ||
    conversation.patientId === authUser.id;

  if (!canMark) {
    throw new AppError(status.FORBIDDEN, "You are not allowed to mark this message as read");
  }

  const updatedMessage = await prisma.chatMessage.update({
    where: {
      id: messageId,
    },
    data: {
      readAt: new Date(),
    },
    include: messageInclude,
  });

  return updatedMessage;
};

const deleteMessage = async (messageId: string, authUser: User) => {
  const { message } = await ensureMessageAccess(messageId, authUser);

  const canDelete =
    authUser.role === CHAT_ROLE.ADMIN ||
    authUser.role === CHAT_ROLE.MANAGER ||
    message.senderId === authUser.id;

  if (!canDelete) {
    throw new AppError(status.FORBIDDEN, "You are not allowed to delete this message");
  }

  const deletedMessage = await prisma.chatMessage.update({
    where: {
      id: messageId,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
    include: messageInclude,
  });

  return deletedMessage;
};

const chatWithAi = async (payload: IAiChatPayload, authUser: User) => {
  if (authUser.role !== CHAT_ROLE.PATIENT) {
    throw new AppError(status.FORBIDDEN, "Only patients can use AI assistant chat");
  }

  let conversationId = payload.conversationId;

  if (conversationId) {
    const conversation = await ensureConversationAccess(conversationId, authUser);

    if (conversation.type !== CONVERSATION_TYPE.AI_ASSISTANT) {
      throw new AppError(
        status.BAD_REQUEST,
        "This conversation is not an AI assistant conversation"
      );
    }
  } else {
    const conversation = await prisma.conversation.create({
      data: {
        title: "AI Assistant",
        type: CONVERSATION_TYPE.AI_ASSISTANT,
        patientId: authUser.id,
      },
      select: {
        id: true,
      },
    });

    conversationId = conversation.id;
  }

  const patientMessage = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId: authUser.id,
      content: payload.message,
      senderType: CHAT_SENDER_TYPE.PATIENT,
    },
    include: messageInclude,
  });

  const aiReply = buildAiSafeReply(payload.message);

  const aiMessage = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId: null,
      recipientId: authUser.id,
      content: aiReply,
      senderType: CHAT_SENDER_TYPE.AI,
    },
    include: messageInclude,
  });

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  return {
    conversationId,
    patientMessage,
    aiMessage,
  };
};

export const ChatService = {
  getConversations,
  createConversation,
  getConversationById,
  deleteConversation,
  getMessages,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  chatWithAi,
};
