export type TSortOrder = "asc" | "desc";

export type TPaginationOptions = {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: TSortOrder | string;
};

export type TPaginationConfig = {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
  defaultSortBy?: string;
  defaultSortOrder?: TSortOrder;
};

export type TPaginationResult = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: TSortOrder;
};
