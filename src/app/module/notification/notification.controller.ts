import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/helpers/catchAsync";
import { sendResponse } from "../../shared/response/sendResponse";
import { IMarkNotificationsReadPayload, INotificationQuery } from "./notification.interface";
import { NotificationService } from "./notification.service";
import { getParamId } from "./notification.utils";

const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.getNotifications(
    req.query as INotificationQuery,
    req.user!
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Notifications fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getUnreadSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.getUnreadSummary(req.user!);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Unread notification summary fetched successfully",
    data: result,
  });
});

const createNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.createNotification(req.body, req.user!);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Notification created successfully",
    data: result,
  });
});

const getNotificationById = catchAsync(async (req: Request, res: Response) => {
  const notificationId = getParamId(req.params.id);

  const result = await NotificationService.getNotificationById(notificationId, req.user!);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Notification fetched successfully",
    data: result,
  });
});

const markNotificationsAsRead = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.markNotificationsAsRead(
    req.body as IMarkNotificationsReadPayload,
    req.user!
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Notifications marked as read successfully",
    data: result,
  });
});

const markSingleNotificationAsRead = catchAsync(async (req: Request, res: Response) => {
  const notificationId = getParamId(req.params.id);

  const result = await NotificationService.markSingleNotificationAsRead(notificationId, req.user!);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Notification marked as read successfully",
    data: result,
  });
});

const markAllNotificationsAsRead = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.markAllNotificationsAsRead(req.user!);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "All notifications marked as read successfully",
    data: result,
  });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const notificationId = getParamId(req.params.id);

  const result = await NotificationService.deleteNotification(notificationId, req.user!);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Notification deleted successfully",
    data: result,
  });
});

export const NotificationController = {
  getNotifications,
  getUnreadSummary,
  createNotification,
  getNotificationById,
  markNotificationsAsRead,
  markSingleNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
