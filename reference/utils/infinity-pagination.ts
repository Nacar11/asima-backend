import { IPaginationOptions } from '@/utils/types/pagination-options';
import { InfinityPaginationResponseDto } from '@/utils/dto/infinity-pagination-response.dto';

export const infinityPagination = <T>(
  data: T[],
  options: IPaginationOptions,
): InfinityPaginationResponseDto<T> => {
  return {
    data,
    hasNextPage: data.length === options.limit,
  };
};
