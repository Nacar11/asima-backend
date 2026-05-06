/**
 * Escrow transaction type enumeration.
 *
 * Represents the type of escrow transaction: deposit, release, refund,
 * dispute hold, or dispute release.
 *
 * @version 1
 * @since 1.0.0
 */
export enum EscrowTransactionTypeEnum {
  DEPOSIT = 'deposit',
  RELEASE = 'release',
  REFUND = 'refund',
  DISPUTE_HOLD = 'dispute_hold',
  DISPUTE_RELEASE = 'dispute_release',
}
