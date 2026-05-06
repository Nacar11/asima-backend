import { CheckoutPayment } from '@/checkout-payments/domain/checkout-payment';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Abstract repository interface for CheckoutPayment operations.
 *
 * Defines the contract for checkout payment data access operations.
 * Concrete implementations handle the actual database interactions.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseCheckoutPaymentRepository {
  /**
   * Create a new checkout payment.
   *
   * @param payment - Checkout payment domain model to create
   * @returns Promise<CheckoutPayment> - Created checkout payment
   */
  abstract create(payment: CheckoutPayment): Promise<CheckoutPayment>;

  /**
   * Find checkout payments with DevExtreme support.
   *
   * Supports filtering, sorting, and pagination using DevExtreme
   * load options. Used for admin/reporting interfaces.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<CheckoutPayment>>
   */
  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<CheckoutPayment>>;

  /**
   * Find all checkout payments with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<CheckoutPayment>>
   */
  abstract findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<CheckoutPayment>>;

  /**
   * Find a checkout payment by ID.
   *
   * @param id - The checkout payment ID
   * @returns Promise<CheckoutPayment | null> - Payment if found, null otherwise
   */
  abstract findById(id: number): Promise<CheckoutPayment | null>;

  /**
   * Find a checkout payment by gateway reference number.
   *
   * @param gatewayReferenceNumber - The gateway reference number
   * @returns Promise<CheckoutPayment | null> - Payment if found, null otherwise
   */
  abstract findByGatewayReferenceNumber(
    gatewayReferenceNumber: string,
  ): Promise<CheckoutPayment | null>;

  /**
   * Find checkout payments by checkout order ID.
   *
   * @param checkoutOrderId - The checkout order ID
   * @returns Promise<CheckoutPayment[]> - Array of payments for the checkout order
   */
  abstract findByCheckoutOrderId(
    checkoutOrderId: number,
  ): Promise<CheckoutPayment[]>;

  /**
   * Find checkout payments by gateway transaction ID.
   *
   * @param gatewayTransactionId - The gateway transaction ID
   * @returns Promise<CheckoutPayment | null> - Payment if found, null otherwise
   */
  abstract findByGatewayTransactionId(
    gatewayTransactionId: string,
  ): Promise<CheckoutPayment | null>;

  /**
   * Find checkout payments by sales order ID.
   *
   * @param salesOrderId - The sales order ID
   * @returns Promise<CheckoutPayment[]>
   */
  abstract findBySalesOrderId(salesOrderId: number): Promise<CheckoutPayment[]>;

  /**
   * Find an existing pending/awaiting session-based payment by idempotency key.
   *
   * @param userId - Payment owner user ID
   * @param idempotencyKey - Session idempotency key stored in metadata
   */
  abstract findPendingSessionPaymentByIdempotencyKey(
    userId: number,
    idempotencyKey: string,
  ): Promise<CheckoutPayment | null>;

  /**
   * Find a checkout payment by transaction number.
   *
   * @param transactionNumber - The transaction number
   * @returns Promise<CheckoutPayment | null> - Payment if found, null otherwise
   */
  abstract findByTransactionNumber(
    transactionNumber: string,
  ): Promise<CheckoutPayment | null>;

  /**
   * Update a checkout payment.
   *
   * @param id - The checkout payment ID
   * @param payload - Partial payment data to update
   * @returns Promise<CheckoutPayment> - Updated payment
   */
  abstract update(
    id: number,
    payload: Partial<CheckoutPayment>,
  ): Promise<CheckoutPayment>;

  /**
   * Transition payment to awaiting_payment only if current status is pending.
   * Prevents race where fast callback updates terminal status first.
   */
  abstract transitionToAwaitingPaymentIfPending(
    id: number,
    gatewayReferenceNumber: string | null,
    gatewayCheckoutUrl: string | null,
  ): Promise<CheckoutPayment>;

  /**
   * Atomically apply a refund amount using a single UPDATE with a WHERE guard.
   *
   * Prevents double-refund races by ensuring `total_refunded + refundAmount <= amount`
   * is evaluated inside the DB engine, not in application code. Returns null if the
   * guard fails (already fully refunded, or concurrent refund already claimed the amount).
   *
   * @param id - Payment ID
   * @param refundAmount - Amount to add to total_refunded
   * @param isFullyRefunded - Whether this refund brings total_refunded to >= amount
   * @param newStatus - PARTIALLY_REFUNDED or FULLY_REFUNDED
   * @param updatedById - User performing the refund (for audit)
   * @returns Updated payment, or null if the atomic guard rejected the update
   */
  abstract atomicRefund(
    id: number,
    refundAmount: number,
    isFullyRefunded: boolean,
    newStatus: string,
    updatedById: number,
  ): Promise<CheckoutPayment | null>;
}
