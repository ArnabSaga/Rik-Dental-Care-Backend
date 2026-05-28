import status from "http-status";
import { Prisma, User } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";
import { QueryBuilder } from "../../shared/helpers/queryHelper";
import {
  ICreateInvoicePayload,
  IInvoiceItemPayload,
  IInvoiceQuery,
  IUpdateInvoicePayload,
} from "./invoice.interface";
import {
  calculateInvoiceTotals,
  calculateLineTotal,
  decimalToNumber,
  generateInvoiceNo,
  getAttachmentTypeFromMime,
  getInvoiceDateRangeWhere,
  getUploadedFilePublicId,
  getUploadedFileUrl,
  INVOICE_ROLE,
  INVOICE_STATUS,
  invoiceFilterableFields,
  invoiceInclude,
  invoiceSearchableFields,
  invoiceSelectableFields,
  invoiceSortableFields,
  normalizeDate,
  removeUndefinedFields,
  resolveInvoiceStatus,
  toDecimal,
} from "./invoice.utils";

const ensureAppointmentForInvoice = async (appointmentId: string) => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      isDeleted: false,
      status: {
        notIn: ["CANCELLED", "NO_SHOW"],
      },
      patient: {
        is: {
          isDeleted: false,
          isActive: true,
        },
      },
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      appointmentServices: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              isActive: true,
              isDeleted: true,
            },
          },
        },
      },
    },
  });

  if (!appointment) {
    throw new AppError(status.NOT_FOUND, "Valid appointment not found");
  }

  return appointment;
};

const ensureInvoiceAccess = async (invoiceId: string, authUser: User) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      isDeleted: false,
    },
    include: invoiceInclude,
  });

  if (!invoice) {
    throw new AppError(status.NOT_FOUND, "Invoice not found");
  }

  const patientId = invoice.appointment.patientId;

  const canAccess =
    authUser.role === INVOICE_ROLE.ADMIN ||
    authUser.role === INVOICE_ROLE.MANAGER ||
    patientId === authUser.id;

  if (!canAccess) {
    throw new AppError(status.FORBIDDEN, "You are not allowed to access this invoice");
  }

  return invoice;
};

const buildAttachmentCreatePayload = (file?: Express.Multer.File) => {
  const fileUrl = getUploadedFileUrl(file);

  if (!file || !fileUrl) return undefined;

  return {
    url: fileUrl,
    publicId: getUploadedFilePublicId(file),
    fileType: getAttachmentTypeFromMime(file.mimetype),
    resourceType: file.mimetype,
  };
};

const buildInvoiceItemsFromPayload = (items: IInvoiceItemPayload[]) => {
  return items.map((item) => {
    const quantity = item.quantity ?? 1;
    const discountAmount = item.discountAmount ?? 0;
    const totalAmount = calculateLineTotal(quantity, item.unitPrice, discountAmount);

    return {
      serviceId: item.serviceId ?? null,
      serviceName: item.serviceName,
      description: item.description,
      quantity,
      unitPrice: toDecimal(item.unitPrice),
      discountAmount: toDecimal(discountAmount),
      totalAmount: toDecimal(totalAmount),
    };
  });
};

const buildInvoiceItemsFromAppointment = async (appointmentId: string) => {
  const appointmentServices = await prisma.appointmentService.findMany({
    where: {
      appointmentId,
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          basePrice: true,
        },
      },
    },
  });

  if (appointmentServices.length === 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "No appointment services found. Please provide invoice items manually"
    );
  }

  return appointmentServices.map((item) => {
    const unitPrice = decimalToNumber(item.unitPrice ?? item.service.basePrice);
    const quantity = item.quantity ?? 1;
    const totalAmount = calculateLineTotal(quantity, unitPrice, 0);

    return {
      serviceId: item.serviceId,
      serviceName: item.service.name,
      description: item.notes,
      quantity,
      unitPrice: toDecimal(unitPrice),
      discountAmount: toDecimal(0),
      totalAmount: toDecimal(totalAmount),
    };
  });
};

const getInvoiceItemNumbers = (
  items: Array<{
    quantity: number;
    unitPrice: Prisma.Decimal;
    discountAmount: Prisma.Decimal;
  }>
) => {
  return items.map((item) => ({
    quantity: item.quantity,
    unitPrice: decimalToNumber(item.unitPrice),
    discountAmount: decimalToNumber(item.discountAmount),
  }));
};

const getInvoices = async (query: IInvoiceQuery, authUser: User) => {
  const baseWhere: Prisma.InvoiceWhereInput = {
    isDeleted: false,
    ...getInvoiceDateRangeWhere(query),
  };

  if (authUser.role === INVOICE_ROLE.PATIENT) {
    baseWhere.appointment = {
      is: {
        patientId: authUser.id,
        isDeleted: false,
      },
    };
  }

  if (authUser.role !== INVOICE_ROLE.PATIENT && query.patientId) {
    baseWhere.appointment = {
      is: {
        patientId: query.patientId,
        isDeleted: false,
      },
    };
  }

  const safeQuery = {
    ...query,
  };

  delete safeQuery.patientId;
  delete safeQuery.dueDateFrom;
  delete safeQuery.dueDateTo;
  delete safeQuery.createdAtFrom;
  delete safeQuery.createdAtTo;

  const queryBuilder = new QueryBuilder(prisma.invoice, safeQuery, {
    searchableFields: invoiceSearchableFields,
    filterableFields: invoiceFilterableFields,
    sortableFields: invoiceSortableFields,
    selectableFields: invoiceSelectableFields,
    dateFields: ["dueDate", "createdAt", "updatedAt"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultLimit: 10,
    maxLimit: 100,
  });

  const result = await queryBuilder
    .where(baseWhere)
    .include(invoiceInclude)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();

  return result;
};

const createInvoice = async (
  payload: ICreateInvoicePayload,
  authUser: User,
  file?: Express.Multer.File
) => {
  if (authUser.role !== INVOICE_ROLE.ADMIN) {
    throw new AppError(status.FORBIDDEN, "Only doctor/admin can create invoice");
  }

  await ensureAppointmentForInvoice(payload.appointmentId);

  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      appointmentId: payload.appointmentId,
      isDeleted: false,
    },
    select: {
      id: true,
    },
  });

  if (existingInvoice) {
    throw new AppError(status.CONFLICT, "Invoice already exists for this appointment");
  }

  const items = payload.items
    ? buildInvoiceItemsFromPayload(payload.items)
    : await buildInvoiceItemsFromAppointment(payload.appointmentId);

  const totals = calculateInvoiceTotals({
    items: getInvoiceItemNumbers(items),
    discountAmount: payload.discountAmount ?? 0,
    taxAmount: payload.taxAmount ?? 0,
    paidAmount: 0,
  });

  const dueDate = normalizeDate(payload.dueDate);

  const statusValue = resolveInvoiceStatus({
    requestedStatus: payload.status,
    paidAmount: totals.paidAmount,
    totalAmount: totals.totalAmount,
    dueAmount: totals.dueAmount,
    dueDate: dueDate ?? null,
  });

  const attachmentPayload = buildAttachmentCreatePayload(file);
  const invoiceNo = await generateInvoiceNo();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      appointmentId: payload.appointmentId,
      issuedById: authUser.id,
      subtotalAmount: toDecimal(totals.subtotalAmount),
      discountAmount: toDecimal(totals.discountAmount),
      taxAmount: toDecimal(totals.taxAmount),
      totalAmount: toDecimal(totals.totalAmount),
      paidAmount: toDecimal(totals.paidAmount),
      dueAmount: toDecimal(totals.dueAmount),
      status: statusValue,
      dueDate,
      pdfUrl: payload.pdfUrl,
      items: {
        create: items,
      },
      ...(attachmentPayload
        ? {
            attachments: {
              create: attachmentPayload,
            },
          }
        : {}),
    },
    include: invoiceInclude,
  });

  return invoice;
};

const getInvoiceById = async (invoiceId: string, authUser: User) => {
  return await ensureInvoiceAccess(invoiceId, authUser);
};

const getInvoiceForTemplate = async (invoiceId: string, authUser: User) => {
  const invoice = await ensureInvoiceAccess(invoiceId, authUser);

  return invoice;
};

const updateInvoice = async (
  invoiceId: string,
  payload: IUpdateInvoicePayload,
  authUser: User,
  file?: Express.Multer.File
) => {
  if (authUser.role !== INVOICE_ROLE.ADMIN) {
    throw new AppError(status.FORBIDDEN, "Only doctor/admin can update invoice");
  }

  const existingInvoice = await ensureInvoiceAccess(invoiceId, authUser);

  if (
    existingInvoice.status === INVOICE_STATUS.CANCELLED ||
    existingInvoice.status === INVOICE_STATUS.REFUNDED
  ) {
    throw new AppError(status.BAD_REQUEST, "Cancelled or refunded invoice cannot be updated");
  }

  const existingItems =
    payload.items !== undefined
      ? buildInvoiceItemsFromPayload(payload.items)
      : existingInvoice.items.map((item) => ({
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          totalAmount: item.totalAmount,
        }));

  const discountAmount =
    payload.discountAmount !== undefined
      ? payload.discountAmount
      : decimalToNumber(existingInvoice.discountAmount);

  const taxAmount =
    payload.taxAmount !== undefined
      ? payload.taxAmount
      : decimalToNumber(existingInvoice.taxAmount);

  const paidAmount =
    payload.paidAmount !== undefined
      ? payload.paidAmount
      : decimalToNumber(existingInvoice.paidAmount);

  const totals = calculateInvoiceTotals({
    items: getInvoiceItemNumbers(existingItems),
    discountAmount,
    taxAmount,
    paidAmount,
  });

  const dueDate =
    payload.dueDate !== undefined ? normalizeDate(payload.dueDate) : existingInvoice.dueDate;

  const statusValue = resolveInvoiceStatus({
    requestedStatus: payload.status ?? existingInvoice.status,
    paidAmount: totals.paidAmount,
    totalAmount: totals.totalAmount,
    dueAmount: totals.dueAmount,
    dueDate,
  });

  const attachmentPayload = buildAttachmentCreatePayload(file);

  const updatePayload = removeUndefinedFields({
    dueDate,
    discountAmount: toDecimal(totals.discountAmount),
    taxAmount: toDecimal(totals.taxAmount),
    subtotalAmount: toDecimal(totals.subtotalAmount),
    totalAmount: toDecimal(totals.totalAmount),
    paidAmount: toDecimal(totals.paidAmount),
    dueAmount: toDecimal(totals.dueAmount),
    status: statusValue,
    pdfUrl: payload.pdfUrl,
  });

  if (
    Object.keys(updatePayload).length === 0 &&
    payload.items === undefined &&
    !attachmentPayload
  ) {
    throw new AppError(status.BAD_REQUEST, "No valid update data provided");
  }

  const updatedInvoice = await prisma.$transaction(async (tx) => {
    if (payload.items !== undefined) {
      await tx.invoiceItem.deleteMany({
        where: {
          invoiceId,
        },
      });
    }

    return await tx.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        ...(updatePayload as Prisma.InvoiceUpdateInput),
        ...(payload.items !== undefined
          ? {
              items: {
                create: existingItems,
              },
            }
          : {}),
        ...(attachmentPayload
          ? {
              attachments: {
                create: attachmentPayload,
              },
            }
          : {}),
      },
      include: invoiceInclude,
    });
  });

  return updatedInvoice;
};

const deleteInvoice = async (invoiceId: string, authUser: User) => {
  if (authUser.role !== INVOICE_ROLE.ADMIN) {
    throw new AppError(status.FORBIDDEN, "Only doctor/admin can delete invoice");
  }

  await ensureInvoiceAccess(invoiceId, authUser);

  const deletedInvoice = await prisma.invoice.update({
    where: {
      id: invoiceId,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      status: INVOICE_STATUS.CANCELLED,
      attachments: {
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
      payments: {
        updateMany: {
          where: {
            isDeleted: false,
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            status: "CANCELLED",
          },
        },
      },
    },
    include: invoiceInclude,
  });

  return deletedInvoice;
};

export const InvoiceService = {
  getInvoices,
  createInvoice,
  getInvoiceById,
  getInvoiceForTemplate,
  updateInvoice,
  deleteInvoice,
};
