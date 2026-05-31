import status from "http-status";
import { Prisma, User } from "../../../generated/prisma/client";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";
import { QueryBuilder } from "../../shared/helpers/queryHelper";
import { sendEmail } from "../../utils/emailTemplate";
import {
  ICreateNotificationPayload,
  IMarkNotificationsReadPayload,
  INotificationQuery,
} from "./notification.interface";
import {
  NOTIFICATION_ROLE,
  NOTIFICATION_TYPE,
  getNotificationDateRangeWhere,
  notificationFilterableFields,
  notificationInclude,
  notificationSearchableFields,
  notificationSelectableFields,
  notificationSortableFields,
} from "./notification.utils";

const ensureRecipientExists = async (recipientId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: recipientId,
      isDeleted: false,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "Notification recipient not found");
  }

  return user;
};

const buildNotificationActionUrl = (payload: {
  entityType?: string | null;
  entityId?: string | null;
}) => {
  const frontendUrl = envVars.FRONTEND_URL.replace(/\/$/, "");

  if (!payload.entityType || !payload.entityId) {
    return `${frontendUrl}/dashboard/notifications`;
  }

  switch (payload.entityType) {
    case "APPOINTMENT":
      return `${frontendUrl}/dashboard/appointments/${payload.entityId}`;

    case "INVOICE":
      return `${frontendUrl}/dashboard/invoices/${payload.entityId}`;

    case "PRESCRIPTION":
      return `${frontendUrl}/dashboard/prescriptions/${payload.entityId}`;

    case "MEDICAL_HISTORY":
      return `${frontendUrl}/dashboard/medical-history/${payload.entityId}`;

    case "PAYMENT":
      return `${frontendUrl}/dashboard/payments/${payload.entityId}`;

    default:
      return `${frontendUrl}/dashboard/notifications`;
  }
};

const sendNotificationEmail = async (payload: {
  recipientEmail: string;
  recipientName?: string | null;
  title: string;
  message: string;
  type?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}) => {
  const actionUrl = buildNotificationActionUrl({
    entityType: payload.entityType,
    entityId: payload.entityId,
  });

  await sendEmail({
    to: payload.recipientEmail,
    subject: payload.title,
    templateName: "notification",
    templateData: {
      recipientName: payload.recipientName || "Patient",
      title: payload.title,
      message: payload.message,
      type: payload.type || NOTIFICATION_TYPE.SYSTEM,
      entityType: payload.entityType,
      entityId: payload.entityId,
      actionUrl,
    },
    text: `${payload.title}\n\n${payload.message}\n\nView details: ${actionUrl}`,
  });
};

const ensureNotificationAccess = async (
  notificationId: string,
  authUser: User,
) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      isDeleted: false,
    },
    include: notificationInclude,
  });

  if (!notification) {
    throw new AppError(status.NOT_FOUND, "Notification not found");
  }

  const canAccess =
    authUser.role === NOTIFICATION_ROLE.ADMIN ||
    notification.recipientId === authUser.id;

  if (!canAccess) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not allowed to access this notification",
    );
  }

  return notification;
};

const getNotifications = async (query: INotificationQuery, authUser: User) => {
  const baseWhere: Prisma.NotificationWhereInput = {
    isDeleted: false,
    ...getNotificationDateRangeWhere(query),
  };

  if (authUser.role !== NOTIFICATION_ROLE.ADMIN) {
    baseWhere.recipientId = authUser.id;
  }

  const safeQuery = {
    ...query,
  };

  delete safeQuery.createdAtFrom;
  delete safeQuery.createdAtTo;

  if (authUser.role !== NOTIFICATION_ROLE.ADMIN) {
    delete safeQuery.recipientId;
  }

  const queryBuilder = new QueryBuilder(prisma.notification, safeQuery, {
    searchableFields: notificationSearchableFields,
    filterableFields: notificationFilterableFields,
    sortableFields: notificationSortableFields,
    selectableFields: notificationSelectableFields,
    booleanFields: ["isRead"],
    dateFields: ["createdAt", "updatedAt", "readAt"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultLimit: 10,
    maxLimit: 100,
  });

  const result = await queryBuilder
    .where(baseWhere)
    .include(notificationInclude)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();

  return result;
};

const getUnreadSummary = async (authUser: User) => {
  const where: Prisma.NotificationWhereInput = {
    isDeleted: false,
    isRead: false,
  };

  if (authUser.role !== NOTIFICATION_ROLE.ADMIN) {
    where.recipientId = authUser.id;
  }

  const [
    totalUnread,
    appointmentUnread,
    invoiceUnread,
    prescriptionUnread,
    emergencyUnread,
    reminderUnread,
    systemUnread,
  ] = await Promise.all([
    prisma.notification.count({ where }),

    prisma.notification.count({
      where: {
        ...where,
        type: NOTIFICATION_TYPE.APPOINTMENT,
      },
    }),

    prisma.notification.count({
      where: {
        ...where,
        type: NOTIFICATION_TYPE.INVOICE,
      },
    }),

    prisma.notification.count({
      where: {
        ...where,
        type: NOTIFICATION_TYPE.PRESCRIPTION,
      },
    }),

    prisma.notification.count({
      where: {
        ...where,
        type: NOTIFICATION_TYPE.EMERGENCY,
      },
    }),

    prisma.notification.count({
      where: {
        ...where,
        type: NOTIFICATION_TYPE.REMINDER,
      },
    }),

    prisma.notification.count({
      where: {
        ...where,
        type: NOTIFICATION_TYPE.SYSTEM,
      },
    }),
  ]);

  return {
    totalUnread,
    byType: {
      appointment: appointmentUnread,
      invoice: invoiceUnread,
      prescription: prescriptionUnread,
      emergency: emergencyUnread,
      reminder: reminderUnread,
      system: systemUnread,
    },
  };
};

const createNotification = async (
  payload: ICreateNotificationPayload,
  authUser?: User,
) => {
  if (authUser && authUser.role !== NOTIFICATION_ROLE.ADMIN) {
    throw new AppError(
      status.FORBIDDEN,
      "Only admin can manually create notification",
    );
  }

  const recipient = await ensureRecipientExists(payload.recipientId);

  const notification = await prisma.notification.create({
    data: {
      recipientId: payload.recipientId,
      title: payload.title,
      message: payload.message,
      type: payload.type ?? NOTIFICATION_TYPE.SYSTEM,
      entityType: payload.entityType,
      entityId: payload.entityId,
    },
    include: notificationInclude,
  });

  await sendNotificationEmail({
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: payload.title,
    message: payload.message,
    type: payload.type ?? NOTIFICATION_TYPE.SYSTEM,
    entityType: payload.entityType,
    entityId: payload.entityId,
  }).catch((error) => {
    console.error("[Notification Email Error]", error);
  });

  return notification;
};

const createSystemNotification = async (
  payload: ICreateNotificationPayload,
) => {
  const recipient = await ensureRecipientExists(payload.recipientId);

  const notification = await prisma.notification.create({
    data: {
      recipientId: payload.recipientId,
      title: payload.title,
      message: payload.message,
      type: payload.type ?? NOTIFICATION_TYPE.SYSTEM,
      entityType: payload.entityType,
      entityId: payload.entityId,
    },
    include: notificationInclude,
  });

  await sendNotificationEmail({
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: payload.title,
    message: payload.message,
    type: payload.type ?? NOTIFICATION_TYPE.SYSTEM,
    entityType: payload.entityType,
    entityId: payload.entityId,
  }).catch((error) => {
    console.error("[System Notification Email Error]", error);
  });

  return notification;
};

const getNotificationById = async (notificationId: string, authUser: User) => {
  return await ensureNotificationAccess(notificationId, authUser);
};

const markNotificationsAsRead = async (
  payload: IMarkNotificationsReadPayload,
  authUser: User,
) => {
  const where: Prisma.NotificationWhereInput = {
    id: {
      in: payload.ids,
    },
    isDeleted: false,
  };

  if (authUser.role !== NOTIFICATION_ROLE.ADMIN) {
    where.recipientId = authUser.id;
  }

  const matchedCount = await prisma.notification.count({
    where,
  });

  if (matchedCount === 0) {
    throw new AppError(status.NOT_FOUND, "No matching notifications found");
  }

  const result = await prisma.notification.updateMany({
    where,
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return {
    matched: matchedCount,
    updated: result.count,
    message: "Notifications marked as read successfully",
  };
};

const markSingleNotificationAsRead = async (
  notificationId: string,
  authUser: User,
) => {
  await ensureNotificationAccess(notificationId, authUser);

  const notification = await prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
    include: notificationInclude,
  });

  return notification;
};

const markAllNotificationsAsRead = async (authUser: User) => {
  const where: Prisma.NotificationWhereInput = {
    isDeleted: false,
    isRead: false,
  };

  if (authUser.role !== NOTIFICATION_ROLE.ADMIN) {
    where.recipientId = authUser.id;
  }

  const result = await prisma.notification.updateMany({
    where,
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return {
    updated: result.count,
    message: "All notifications marked as read successfully",
  };
};

const deleteNotification = async (notificationId: string, authUser: User) => {
  await ensureNotificationAccess(notificationId, authUser);

  const notification = await prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
    include: notificationInclude,
  });

  return notification;
};

export const NotificationService = {
  getNotifications,
  getUnreadSummary,
  createNotification,
  createSystemNotification,
  getNotificationById,
  markNotificationsAsRead,
  markSingleNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
