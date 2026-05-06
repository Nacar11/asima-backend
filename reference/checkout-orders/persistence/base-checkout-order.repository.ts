import { CheckoutOrder } from '@/checkout-orders/domain/checkout-order';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Abstract repository interface for CheckoutOrder operations.
 *
 * Defines the contract for checkout order data access operations.
 * Concrete implementations handle the actual database interactions.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseCheckoutOrderRepository {
  /**
   * Create a new checkout order.
   *
   * @param order - Checkout order domain model to create
   * @returns Promise<CheckoutOrder> - Created checkout order
   */
  abstract create(order: CheckoutOrder): Promise<CheckoutOrder>;

  /**
   * Find checkout orders with DevExtreme support.
   *
   * Supports filtering, sorting, and pagination using DevExtreme
   * load options. Used for admin/reporting interfaces.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<CheckoutOrder>>
   */
  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<CheckoutOrder>>;

  /**
   * Find all checkout orders with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<CheckoutOrder>>
   */
  abstract findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<CheckoutOrder>>;

  /**
   * Find a checkout order by ID.
   *
   * @param id - The checkout order ID
   * @returns Promise<CheckoutOrder | null> - Order if found, null otherwise
   */
  abstract findById(id: number): Promise<CheckoutOrder | null>;

  /**
   * Find a checkout order by order number.
   *
   * @param orderNumber - The order number (e.g., 'ORD-20241211-1234')
   * @returns Promise<CheckoutOrder | null> - Order if found, null otherwise
   */
  abstract findByOrderNumber(
    orderNumber: string,
  ): Promise<CheckoutOrder | null>;

  /**
   * Find checkout orders by user ID.
   *
   * @param userId - The user's ID
   * @param paginationOptions - Pagination options
   * @returns Promise<IPaginatedResult<CheckoutOrder>> - Paginated orders
   */
  abstract findByUserId(
    userId: number,
    paginationOptions: IPaginationOptions,
  ): Promise<IPaginatedResult<CheckoutOrder>>;

  /**
   * Update a checkout order.
   *
   * @param id - The checkout order ID
   * @param payload - Partial order data to update
   * @returns Promise<CheckoutOrder> - Updated checkout order
   */
  abstract update(
    id: number,
    payload: Partial<CheckoutOrder>,
  ): Promise<CheckoutOrder>;

  /**
   * Soft delete a checkout order.
   *
   * @param id - The checkout order ID
   * @returns Promise<void>
   */
  abstract remove(id: number): Promise<void>;
}
