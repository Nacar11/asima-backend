/**
 * Payout status enumeration.
 *
 * Represents the status of seller payouts from pending to completed or failed.
 *
 * @version 1
 * @since 1.0.0
 */
export enum PayoutStatusEnum {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
