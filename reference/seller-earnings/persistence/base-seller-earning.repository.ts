import { SellerEarning } from '@/seller-earnings/domain/seller-earning';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Abstract repository interface for SellerEarning operations.
 *
 * Defines the contract for seller earning data access operations.
 * Concrete implementations handle the actual database interactions.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseSellerEarningRepository {
  /**
   * Create a new seller earning record.
   *
   * @param earning - Seller earning domain model to create
   * @returns Promise<SellerEarning> - Created seller earning
   */
  abstract create(earning: SellerEarning): Promise<SellerEarning>;

  /**
   * Find seller earnings with DevExtreme support.
   *
   * Supports filtering, sorting, and pagination using DevExtreme
   * load options. Used for admin/reporting interfaces.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<SellerEarning>>
   */
  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<SellerEarning>>;

  /**
   * Find all seller earnings with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<SellerEarning>>
   */
  abstract findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SellerEarning>>;

  /**
   * Find a seller earning by ID.
   *
   * @param id - The seller earning ID
   * @returns Promise<SellerEarning | null> - Earning if found, null otherwise
   */
  abstract findById(id: number): Promise<SellerEarning | null>;

  /**
   * Find seller earnings by seller ID.
   *
   * @param sellerId - The seller ID
   * @param status - Optional status filter
   * @returns Promise<SellerEarning[]> - Array of earnings for the seller
   */
  abstract findBySellerId(
    sellerId: number,
    status?: string,
  ): Promise<SellerEarning[]>;

  /**
   * Calculate pending earnings for a seller.
   *
   * @param sellerId - The seller ID
   * @returns Promise<number> - Total pending earnings amount
   */
  abstract calculatePendingEarnings(sellerId: number): Promise<number>;

  /**
   * Calculate available earnings for a seller.
   *
   * @param sellerId - The seller ID
   * @returns Promise<number> - Total available earnings amount
   */
  abstract calculateAvailableEarnings(sellerId: number): Promise<number>;

  /**
   * Calculate earnings for a specific month.
   *
   * @param sellerId - Seller ID
   * @param year - Year (YYYY)
   * @param month - Month (1-12)
   * @returns Promise<number> - Total earnings for the month
   */
  abstract calculateMonthlyEarnings(
    sellerId: number,
    year: number,
    month: number,
  ): Promise<number>;

  /**
   * Get earnings grouped by day for chart data.
   *
   * @param sellerId - Seller ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Promise<Array<{ date: string; amount: number }>> - Daily earnings
   */
  abstract getEarningsByDateRange(
    sellerId: number,
    startDate: string,
    endDate: string,
  ): Promise<Array<{ date: string; amount: number }>>;

  /**
   * Update a seller earning.
   *
   * @param id - The seller earning ID
   * @param payload - Partial earning data to update
   * @returns Promise<SellerEarning> - Updated earning
   */
  abstract update(
    id: number,
    payload: Partial<SellerEarning>,
  ): Promise<SellerEarning>;
}
