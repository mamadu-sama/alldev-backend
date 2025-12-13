export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export const getPaginationParams = (
  params: PaginationParams
): PaginationResult => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20)); // Max 50, default 20

  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
};

export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
};

