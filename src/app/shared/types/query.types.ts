//* Common Prisma-like arg types
export interface PrismaFindManyArgs {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, boolean | Record<string, unknown> | null>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  skip?: number;
  take?: number;
  cursor?: Record<string, unknown>;
  distinct?: string[] | string;
  [key: string]: unknown;
}

export interface PrismaCountArgs {
  where?: Record<string, unknown>;
  cursor?: Record<string, unknown>;
  distinct?: string[] | string;
  [key: string]: unknown;
}

//* Prisma delegate contract
export interface PrismaModelDelegate {
  findMany(args?: any): Promise<any[]>;
  count(args?: any): Promise<number>;
}

//* Supported query params
export interface IQueryParams {
  searchTerm?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  fields?: string;
  include?: string;
  [key: string]: unknown;
}

//* Builder config
export interface IQueryConfig {
  searchableFields?: string[];
  filterableFields?: string[];
  sortableFields?: string[];
  selectableFields?: string[];
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;

  numericFields?: string[];
  booleanFields?: string[];
  dateFields?: string[];

  defaultSortBy?: string;
  defaultSortOrder?: "asc" | "desc";
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
}

//* Prisma-like string filter
export interface PrismaStringFilter {
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  mode?: "insensitive" | "sensitive";
  equals?: string;
  in?: string[];
  notIn?: string[];
  not?: PrismaStringFilter | string;
  lt?: string;
  lte?: string;
  gt?: string;
  gte?: string;
}

//* Prisma-like number filter
export interface PrismaNumberFilter {
  equals?: number;
  in?: number[];
  notIn?: number[];
  not?: PrismaNumberFilter | number;
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
}

//* Where condition helper
export interface PrismaWhereCondition {
  OR?: Record<string, unknown>[];
  AND?: Record<string, unknown>[];
  NOT?: Record<string, unknown>[];
  [key: string]: unknown;
}

//* Final response shape

export interface IQueryResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
