import status from "http-status";
import AppError from "../../shared/errors/AppError";
import slugify from "../../shared/helpers/slugify";
import { prisma } from "../../lib/prisma";

export const DENTAL_SERVICE_ROLE = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  PATIENT: "PATIENT",
} as const;

export const dentalServiceSearchableFields = ["name", "description", "slug"];

export const dentalServiceFilterableFields = ["isActive"];

export const dentalServiceSortableFields = [
  "name",
  "basePrice",
  "isActive",
  "createdAt",
  "updatedAt",
];

export const dentalServiceSelectableFields = [
  "id",
  "name",
  "description",
  "basePrice",
  "slug",
  "isActive",
  "createdAt",
  "updatedAt",
];

export const dentalServicePublicSelect = {
  id: true,
  name: true,
  description: true,
  basePrice: true,
  slug: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const getParamId = (id: string | string[] | undefined): string => {
  if (!id || Array.isArray(id)) {
    throw new AppError(
      status.BAD_REQUEST,
      "Valid dental service id is required",
    );
  }

  return id;
};

export const removeUndefinedFields = <T extends Record<string, unknown>>(
  payload: T,
): Partial<T> => {
  const cleanPayload: Partial<T> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanPayload[key as keyof T] = value as T[keyof T];
    }
  });

  return cleanPayload;
};

export const generateUniqueDentalServiceSlug = async (
  name: string,
  existingServiceId?: string,
): Promise<string> => {
  const baseSlug = slugify(name);

  if (!baseSlug) {
    throw new AppError(
      status.BAD_REQUEST,
      "Service name cannot generate valid slug",
    );
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingService = await prisma.dentalService.findFirst({
      where: {
        slug,
        isDeleted: false,
        ...(existingServiceId
          ? {
              id: {
                not: existingServiceId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (!existingService) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

export const normalizeDentalServiceSlug = async (
  value: {
    name?: string;
    slug?: string;
  },
  existingServiceId?: string,
): Promise<string | undefined> => {
  if (value.slug) {
    const requestedSlug = slugify(value.slug);

    if (!requestedSlug) {
      throw new AppError(status.BAD_REQUEST, "Invalid slug");
    }

    const existingService = await prisma.dentalService.findFirst({
      where: {
        slug: requestedSlug,
        isDeleted: false,
        ...(existingServiceId
          ? {
              id: {
                not: existingServiceId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingService) {
      throw new AppError(status.CONFLICT, "Dental service slug already exists");
    }

    return requestedSlug;
  }

  if (value.name) {
    return generateUniqueDentalServiceSlug(value.name, existingServiceId);
  }

  return undefined;
};
