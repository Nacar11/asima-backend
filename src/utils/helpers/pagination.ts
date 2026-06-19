import { PAGINATION_DEFAULTS } from '@/utils/constants/api.constants';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

/** The paging inputs every list query accepts. */
export type PagingCriteria = { page?: number; limit?: number };

/** Normalized paging: defaulted page/limit (limit clamped) plus the SQL offset. */
export type ResolvedPaging = { page: number; limit: number; skip: number };

/**
 * Single source of truth for the page/limit default + clamp math every
 * repository's `findAll` shares. Resolves `page`/`limit` against
 * PAGINATION_DEFAULTS (clamping `limit` to `maxLimit`) and derives the
 * `skip` offset for `.skip()` / `OFFSET`.
 */
export function resolvePaging(criteria: PagingCriteria): ResolvedPaging {
  const page = criteria.page ?? PAGINATION_DEFAULTS.page;
  const limit = Math.min(criteria.limit ?? PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Wrap a page of rows in the standard `{ data, total, page, limit,
 * has_more }` envelope (the API list-response contract). Pair with
 * `resolvePaging` — pass it the same resolved paging it produced.
 */
export function paginate<T>(
  data: T[],
  total: number,
  paging: { page: number; limit: number },
): PaginatedResponse<T> {
  return {
    data,
    total,
    page: paging.page,
    limit: paging.limit,
    has_more: paging.page * paging.limit < total,
  };
}
