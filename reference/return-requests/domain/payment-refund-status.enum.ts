/**
 * Payment refund status for return requests.
 * Tracks whether the actual payment payout has been processed.
 */
export enum PaymentRefundStatusEnum {
  NOT_APPLICABLE = 'not_applicable',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
