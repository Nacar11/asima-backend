/**
 * Dispute resolution enumeration.
 *
 * Represents the resolution outcome of a dispute.
 *
 * @version 1
 * @since 1.0.0
 */
export enum DisputeResolutionEnum {
  FULL_REFUND = 'full_refund',
  PARTIAL_REFUND = 'partial_refund',
  NO_REFUND = 'no_refund',
  REDO_SERVICE = 'redo_service',
  MUTUAL_AGREEMENT = 'mutual_agreement',
}
