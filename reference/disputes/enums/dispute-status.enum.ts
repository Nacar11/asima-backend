/**
 * Dispute status enumeration.
 *
 * Represents the lifecycle status of a customer dispute.
 *
 * @version 1
 * @since 1.0.0
 */
export enum DisputeStatusEnum {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}
