/**
 * Checkout order status enumeration.
 *
 * Represents the lifecycle status of a checkout order from creation to completion.
 *
 * @version 1
 * @since 1.0.0
 */
export enum CheckoutStatusEnum {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  PARTIAL_FULFILLED = 'partial_fulfilled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}
