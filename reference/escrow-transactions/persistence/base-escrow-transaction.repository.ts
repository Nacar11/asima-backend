import { EscrowTransaction } from '@/escrow-transactions/domain/escrow-transaction';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { EscrowTransactionTypeEnum } from '../enums/escrow-transaction-type.enum';

/**
 * Abstract repository interface for EscrowTransaction operations.
 *
 * Defines the contract for escrow transaction data access operations.
 * Concrete implementations handle the actual database interactions.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseEscrowTransactionRepository {
  /**
   * Create a new escrow transaction.
   *
   * @param transaction - Escrow transaction domain model to create
   * @returns Promise<EscrowTransaction> - Created escrow transaction
   */
  abstract create(transaction: EscrowTransaction): Promise<EscrowTransaction>;

  /**
   * Find escrow transactions with DevExtreme support.
   *
   * Supports filtering, sorting, and pagination using DevExtreme
   * load options. Used for admin/reporting interfaces.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<EscrowTransaction>>
   */
  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<EscrowTransaction>>;

  /**
   * Find all escrow transactions with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<EscrowTransaction>>
   */
  abstract findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<EscrowTransaction>>;

  /**
   * Find an escrow transaction by ID.
   *
   * @param id - The escrow transaction ID
   * @returns Promise<EscrowTransaction | null> - Transaction if found, null otherwise
   */
  abstract findById(id: number): Promise<EscrowTransaction | null>;

  /**
   * Find escrow transactions by booking ID.
   *
   * @param bookingId - The booking ID
   * @returns Promise<EscrowTransaction[]> - Array of transactions for the booking
   */
  abstract findByBookingId(bookingId: number): Promise<EscrowTransaction[]>;

  /**
   * Find escrow transactions by milestone ID.
   *
   * @param milestoneId - The milestone ID
   * @returns Promise<EscrowTransaction[]> - Array of transactions for the milestone
   */
  abstract findByMilestoneId(milestoneId: number): Promise<EscrowTransaction[]>;

  /**
   * Find escrow transactions by transaction type.
   *
   * @param type - The transaction type
   * @param bookingId - Optional booking ID to filter by
   * @returns Promise<EscrowTransaction[]> - Array of transactions matching the type
   */
  abstract findByTransactionType(
    type: EscrowTransactionTypeEnum,
    bookingId?: number,
  ): Promise<EscrowTransaction[]>;

  /**
   * Update an escrow transaction.
   *
   * @param id - The escrow transaction ID
   * @param payload - Partial transaction data to update
   * @returns Promise<EscrowTransaction> - Updated transaction
   */
  abstract update(
    id: number,
    payload: Partial<EscrowTransaction>,
  ): Promise<EscrowTransaction>;
}
