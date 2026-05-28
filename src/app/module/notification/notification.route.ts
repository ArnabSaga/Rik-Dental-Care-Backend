import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { validateRole } from "../../middleware/validateRole";
import { requireAuth } from "../user/user.utils";
import { NotificationController } from "./notification.controller";
import { NOTIFICATION_ROLE } from "./notification.utils";
import { NotificationValidation } from "./notification.validation";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validateRequest({ query: NotificationValidation.getNotificationsQuery }),
  NotificationController.getNotifications
);

router.get("/unread-summary", NotificationController.getUnreadSummary);

router.post(
  "/",
  validateRole(NOTIFICATION_ROLE.ADMIN),
  validateRequest({ body: NotificationValidation.createNotification }),
  NotificationController.createNotification
);

router.post(
  "/mark-as-read",
  validateRequest({ body: NotificationValidation.markNotificationsRead }),
  NotificationController.markNotificationsAsRead
);

router.patch("/mark-all-read", NotificationController.markAllNotificationsAsRead);

router.get(
  "/:id",
  validateRequest({ params: NotificationValidation.idParam }),
  NotificationController.getNotificationById
);

router.patch(
  "/:id/read",
  validateRequest({ params: NotificationValidation.idParam }),
  NotificationController.markSingleNotificationAsRead
);

router.delete(
  "/:id",
  validateRequest({ params: NotificationValidation.idParam }),
  NotificationController.deleteNotification
);

export const NotificationRoutes = router;
