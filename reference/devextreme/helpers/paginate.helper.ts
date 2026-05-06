import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';

/**
 * This function converts DevExtreme pagination parameters (skip/take) to standard pagination parameters (page/limit).
 *
 * DevExtreme uses skip/take pattern where:
 * - `skip`: Number of items to skip from the beginning
 * - `take`: Number of items to take (page size)
 *
 * Standard pagination uses page/limit pattern where:
 * - `page`: Current page number (1-based)
 * - `limit`: Maximum number of items per page
 *
 * @param skip - The number of items to skip from the beginning. Defaults to 0.
 * @param take - The number of items to take (page size). Defaults to 50, capped at 50.
 *
 * @returns An object containing the converted pagination parameters:
 *          - `page`: The calculated page number (1-based)
 *          - `limit`: The page size (capped at 50)
 *
 * @example
 * // First page (skip 0, take 10)
 * transformSkipTakeParams(0, 10) // Returns { page: 1, limit: 10 }
 *
 * // Second page (skip 10, take 10)
 * transformSkipTakeParams(10, 10) // Returns { page: 2, limit: 10 }
 *
 * // Third page (skip 20, take 10)
 * transformSkipTakeParams(20, 10) // Returns { page: 3, limit: 10 }
 */
export function transformSkipTakeParams(
  skip: number = 0,
  take: number = 50,
): IPaginationOptions {
  // Ensure skip is not negative
  const normalizedSkip = Math.max(0, skip);

  // Cap take at 50 and ensure it's at least 1
  const normalizedTake = Math.min(Math.max(1, take), 50);

  // Calculate page number (1-based)
  // If skip is 0, we're on page 1
  // If skip is equal to take, we're on page 2, etc.
  const page =
    normalizedTake > 0 ? Math.floor(normalizedSkip / normalizedTake) + 1 : 1;

  return {
    page,
    limit: normalizedTake,
  };
}

/**
 * This function converts a paginated result to DevExtreme's expected response format.
 *
 * DevExtreme expects a specific response structure with:
 * - `data`: Array of items for the current page
 * - `totalCount`: Total number of items across all pages
 *
 * This function takes the standard IPaginatedResult format and transforms it
 * into the format that DevExtreme components can consume directly.
 *
 * @param result - The paginated result object containing:
 *                 - `data`: Array of items for the current page
 *                 - `totalResults`: Total number of items across all pages
 *
 * @returns An object in DevExtreme's expected format:
 *          - `data`: The array of items
 *          - `totalCount`: The total number of items
 *
 * @example
 * const result = {
 *   data: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
 *   totalResults: 100
 * };
 *
 * paginate(result) // Returns { data: [...], totalCount: 100 }
 */
export const paginate = <T>({
  data,
  totalResults,
}: IPaginatedResult<T>): DevExtremePaginatedResponseDto<T> => {
  return {
    data,
    totalCount: totalResults,
  };
};
