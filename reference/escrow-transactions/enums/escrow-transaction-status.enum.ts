/**
 * Escrow transaction status enumeration.
 *
 * Represents the processing status of an escrow transaction from
 * initiation to completion or failure.
 *
 * @version 1
 * @since 1.0.0
 */
export enum EscrowTransactionStatusEnum {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
