/**
 * Payment status enumeration.
 *
 * Represents the payment status of a checkout order.
 *
 * @version 1
 * @since 1.0.0
 */
export enum PaymentStatusEnum {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  PARTIAL = 'partial',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
