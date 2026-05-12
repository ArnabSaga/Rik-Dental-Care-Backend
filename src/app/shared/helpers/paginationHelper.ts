import {
  TPaginationConfig,
  TPaginationOptions,
  TPaginationResult,
} from "../types/pagination.types";

const toPositiveNumber = (value: unknown, fallback: number, max?: number): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  const safeValue = Math.floor(parsed);

  return max ? Math.min(safeValue, max) : safeValue;
};

const calculatePagination = (
  options: TPaginationOptions = {},
  config: TPaginationConfig = {}
): TPaginationResult => {
  const defaultPage = config.defaultPage ?? 1;
  const defaultLimit = config.defaultLimit ?? 10;
  const maxLimit = config.maxLimit ?? 100;

  const page = toPositiveNumber(options.page, defaultPage);
  const limit = toPositiveNumber(options.limit, defaultLimit, maxLimit);

  const skip = (page - 1) * limit;

  const sortBy = options.sortBy || config.defaultSortBy || "createdAt";

  const sortOrder =
    options.sortOrder === "asc" || options.sortOrder === "desc"
      ? options.sortOrder
      : config.defaultSortOrder || "desc";

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

export const paginationHelper = {
  calculatePagination,
};
