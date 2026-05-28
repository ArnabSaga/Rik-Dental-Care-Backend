import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { requireAuth } from "../user/user.utils";
import { ChatController } from "./chat.controller";
import { ChatValidation } from "./chat.validation";

const router = Router();

router.use(requireAuth);

router.get(
  "/conversations",
  validateRequest({ query: ChatValidation.getConversationsQuery }),
  ChatController.getConversations
);

router.post(
  "/conversations",
  validateRequest({ body: ChatValidation.createConversation }),
  ChatController.createConversation
);

router.get(
  "/conversations/:id",
  validateRequest({ params: ChatValidation.idParam }),
  ChatController.getConversationById
);

router.delete(
  "/conversations/:id",
  validateRequest({ params: ChatValidation.idParam }),
  ChatController.deleteConversation
);

router.get(
  "/conversations/:id/messages",
  validateRequest({
    params: ChatValidation.idParam,
    query: ChatValidation.getMessagesQuery,
  }),
  ChatController.getMessages
);

router.post(
  "/conversations/:id/messages",
  validateRequest({
    params: ChatValidation.idParam,
    body: ChatValidation.sendMessage,
  }),
  ChatController.sendMessage
);

router.patch(
  "/messages/:id/read",
  validateRequest({ params: ChatValidation.idParam }),
  ChatController.markMessageAsRead
);

router.delete(
  "/messages/:id",
  validateRequest({ params: ChatValidation.idParam }),
  ChatController.deleteMessage
);

router.post("/ai", validateRequest({ body: ChatValidation.aiChat }), ChatController.chatWithAi);

export const ChatRoutes = router;
