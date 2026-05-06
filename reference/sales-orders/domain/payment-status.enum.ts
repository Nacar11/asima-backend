/**
 * Payment status for sales orders.
 * Tracks the payment lifecycle on the order level.
 */
export enum PaymentStatusEnum {
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting_payment',
  PAID = 'paid',
  FAILED = 'failed',
  EXPIRED = 'expired',
  COD = 'cod',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}
