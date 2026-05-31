import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/helpers/catchAsync";
import { sendResponse } from "../../shared/response/sendResponse";
import { IConversationQuery, IMessageQuery } from "./chat.interface";
import { ChatService } from "./chat.service";
import { getParamId } from "./chat.utils";

const getConversations = catchAsync(async (req: Request, res: Response) => {
  const result = await ChatService.getConversations(
    req.query as IConversationQuery,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Conversations fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const createConversation = catchAsync(async (req: Request, res: Response) => {
  const result = await ChatService.createConversation(req.body, req.user!);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Conversation created successfully",
    data: result,
  });
});

const getConversationById = catchAsync(async (req: Request, res: Response) => {
  const conversationId = getParamId(req.params.id);

  const result = await ChatService.getConversationById(
    conversationId,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Conversation fetched successfully",
    data: result,
  });
});

const deleteConversation = catchAsync(async (req: Request, res: Response) => {
  const conversationId = getParamId(req.params.id);

  const result = await ChatService.deleteConversation(
    conversationId,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Conversation deleted successfully",
    data: result,
  });
});

const getMessages = catchAsync(async (req: Request, res: Response) => {
  const conversationId = getParamId(req.params.id);

  const result = await ChatService.getMessages(
    conversationId,
    req.query as IMessageQuery,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Messages fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const conversationId = getParamId(req.params.id);

  const result = await ChatService.sendMessage(
    conversationId,
    req.body,
    req.user!,
  );

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Message sent successfully",
    data: result,
  });
});

const markMessageAsRead = catchAsync(async (req: Request, res: Response) => {
  const messageId = getParamId(req.params.id);

  const result = await ChatService.markMessageAsRead(messageId, req.user!);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Message marked as read successfully",
    data: result,
  });
});

const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const messageId = getParamId(req.params.id);

  const result = await ChatService.deleteMessage(messageId, req.user!);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Message deleted successfully",
    data: result,
  });
});

const chatWithAi = catchAsync(async (req: Request, res: Response) => {
  const result = await ChatService.chatWithAi(req.body, req.user!);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "AI assistant response generated successfully",
    data: result,
  });
});

export const ChatController = {
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
