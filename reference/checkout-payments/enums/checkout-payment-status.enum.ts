/**
 * Checkout payment status enumeration.
 *
 * Represents the lifecycle status of a checkout payment from initiation to completion.
 *
 * @version 1
 * @since 1.0.0
 */
export enum CheckoutPaymentStatusEnum {
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting_payment', // User redirected to gateway, awaiting completion
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PARTIALLY_REFUNDED = 'partially_refunded',
  FULLY_REFUNDED = 'fully_refunded',
  CHARGEBACK = 'chargeback',
  // Maya Auth & Capture statuses
  AUTHORIZED = 'authorized', // Hold placed on card, awaiting explicit capture
  CAPTURED = 'captured', // Funds captured (charged), in-progress settlement
  CAPTURE_HOLD_EXPIRED = 'capture_hold_expired', // Hold expired before capture
}
