export type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: TMeta;
  stats?: unknown;
};
