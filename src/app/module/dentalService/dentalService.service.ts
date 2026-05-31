import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/errors/AppError";
import { QueryBuilder } from "../../shared/helpers/queryHelper";
import {
  ICreateDentalServicePayload,
  IDentalServiceQuery,
  IUpdateDentalServicePayload,
  IUpdateDentalServiceStatusPayload,
} from "./dentalService.interface";
import {
  dentalServiceFilterableFields,
  dentalServicePublicSelect,
  dentalServiceSearchableFields,
  dentalServiceSelectableFields,
  dentalServiceSortableFields,
  normalizeDentalServiceSlug,
  removeUndefinedFields,
} from "./dentalService.utils";

const ensureDentalServiceExists = async (id: string) => {
  const service = await prisma.dentalService.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: dentalServicePublicSelect,
  });

  if (!service) {
    throw new AppError(status.NOT_FOUND, "Dental service not found");
  }

  return service;
};

const createDentalService = async (payload: ICreateDentalServicePayload) => {
  const slug = await normalizeDentalServiceSlug({
    name: payload.name,
    slug: payload.slug,
  });

  const service = await prisma.dentalService.create({
    data: {
      name: payload.name,
      description: payload.description,
      basePrice: new Prisma.Decimal(payload.basePrice),
      slug: slug as string,
      isActive: payload.isActive ?? true,
    },
    select: dentalServicePublicSelect,
  });

  return service;
};

const getAllDentalServices = async (query: IDentalServiceQuery) => {
  const queryBuilder = new QueryBuilder(prisma.dentalService, query, {
    searchableFields: dentalServiceSearchableFields,
    filterableFields: dentalServiceFilterableFields,
    sortableFields: dentalServiceSortableFields,
    selectableFields: dentalServiceSelectableFields,
    booleanFields: ["isActive"],
    numericFields: ["basePrice"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultLimit: 10,
    maxLimit: 100,
  });

  const result = await queryBuilder
    .where({
      isDeleted: false,
    })
    .search()
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();

  return result;
};

const getActiveDentalServices = async (query: IDentalServiceQuery) => {
  const queryBuilder = new QueryBuilder(prisma.dentalService, query, {
    searchableFields: dentalServiceSearchableFields,
    sortableFields: dentalServiceSortableFields,
    selectableFields: dentalServiceSelectableFields,
    numericFields: ["basePrice"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultLimit: 20,
    maxLimit: 100,
  });

  const result = await queryBuilder
    .where({
      isDeleted: false,
      isActive: true,
    })
    .search()
    .sort()
    .paginate()
    .fields()
    .execute();

  return result;
};

const getDentalServiceById = async (id: string) => {
  return await ensureDentalServiceExists(id);
};

const getDentalServiceBySlug = async (slug: string) => {
  const service = await prisma.dentalService.findFirst({
    where: {
      slug,
      isDeleted: false,
    },
    select: dentalServicePublicSelect,
  });

  if (!service) {
    throw new AppError(status.NOT_FOUND, "Dental service not found");
  }

  return service;
};

const updateDentalService = async (
  id: string,
  payload: IUpdateDentalServicePayload,
) => {
  await ensureDentalServiceExists(id);

  const slug = await normalizeDentalServiceSlug(
    {
      name: payload.name,
      slug: payload.slug,
    },
    id,
  );

  const cleanPayload = removeUndefinedFields({
    name: payload.name,
    description: payload.description,
    basePrice:
      payload.basePrice !== undefined
        ? new Prisma.Decimal(payload.basePrice)
        : undefined,
    slug,
    isActive: payload.isActive,
  });

  if (Object.keys(cleanPayload).length === 0) {
    throw new AppError(status.BAD_REQUEST, "No valid update data provided");
  }

  const updatedService = await prisma.dentalService.update({
    where: {
      id,
    },
    data: cleanPayload,
    select: dentalServicePublicSelect,
  });

  return updatedService;
};

const updateDentalServiceStatus = async (
  id: string,
  payload: IUpdateDentalServiceStatusPayload,
) => {
  await ensureDentalServiceExists(id);

  const updatedService = await prisma.dentalService.update({
    where: {
      id,
    },
    data: {
      isActive: payload.isActive,
    },
    select: dentalServicePublicSelect,
  });

  return updatedService;
};

const deleteDentalService = async (id: string) => {
  const service = await ensureDentalServiceExists(id);

  const hasAppointmentService = await prisma.appointmentService.findFirst({
    where: {
      serviceId: id,
    },
    select: {
      id: true,
    },
  });

  const hasInvoiceItem = await prisma.invoiceItem.findFirst({
    where: {
      serviceId: id,
    },
    select: {
      id: true,
    },
  });

  if (hasAppointmentService || hasInvoiceItem) {
    const archivedService = await prisma.dentalService.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
      },
      select: dentalServicePublicSelect,
    });

    return {
      id: archivedService.id,
      message:
        "Dental service is linked with appointment or invoice records, so it has been archived safely",
    };
  }

  await prisma.dentalService.update({
    where: {
      id: service.id,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
    },
  });

  return {
    id,
    message: "Dental service deleted successfully",
  };
};

export const DentalServiceService = {
  createDentalService,
  getAllDentalServices,
  getActiveDentalServices,
  getDentalServiceById,
  getDentalServiceBySlug,
  updateDentalService,
  updateDentalServiceStatus,
  deleteDentalService,
};
