import { Dispute } from '@/disputes/domain/dispute';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Abstract repository interface for Dispute operations.
 *
 * Defines the contract for dispute data access operations.
 * Concrete implementations handle the actual database interactions.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseDisputeRepository {
  /**
   * Create a new dispute.
   *
   * @param dispute - Dispute domain model to create
   * @returns Promise<Dispute> - Created dispute
   */
  abstract create(dispute: Dispute): Promise<Dispute>;

  /**
   * Find all disputes with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<Dispute>>
   */
  abstract findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Dispute>>;

  /**
   * Find a dispute by ID.
   *
   * @param id - The dispute ID
   * @returns Promise<Dispute | null>
   */
  abstract findById(id: number): Promise<Dispute | null>;

  /**
   * Find a dispute by booking ID.
   *
   * @param bookingId - The booking ID
   * @returns Promise<Dispute | null>
   */
  abstract findByBookingId(bookingId: number): Promise<Dispute | null>;

  /**
   * Find disputes by customer ID with pagination.
   *
   * @param customerId - The customer's ID
   * @param paginationOptions - Pagination options
   * @param filterOptions - Optional filter (status)
   * @returns Promise<IPaginatedResult<Dispute>>
   */
  abstract findByCustomerId(
    customerId: number,
    paginationOptions: IPaginationOptions,
    filterOptions?: { status?: string },
  ): Promise<IPaginatedResult<Dispute>>;

  /**
   * Find disputes by seller ID with pagination.
   *
   * @param sellerId - The seller's ID
   * @param paginationOptions - Pagination options
   * @param filterOptions - Optional filter (status)
   * @returns Promise<IPaginatedResult<Dispute>>
   */
  abstract findBySellerId(
    sellerId: number,
    paginationOptions: IPaginationOptions,
    filterOptions?: { status?: string },
  ): Promise<IPaginatedResult<Dispute>>;

  /**
   * Update a dispute.
   *
   * @param id - The dispute ID
   * @param payload - Partial dispute data to update
   * @returns Promise<Dispute>
   */
  abstract update(id: number, payload: Partial<Dispute>): Promise<Dispute>;
}
