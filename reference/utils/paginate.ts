import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginatedResponseDto } from '@/utils/dto/paginated-response.dto';
import { IPaginatedResult } from './types/paginated-result';

export const paginate = <T>(
  { data, totalResults }: IPaginatedResult<T>,
  { page, limit }: IPaginationOptions,
): PaginatedResponseDto<T> => {
  const totalPages = limit > 0 ? Math.ceil(totalResults / limit) : 0;

  return {
    data,
    totalResults,
    totalPages,
    currentPage: page,
  };
};
