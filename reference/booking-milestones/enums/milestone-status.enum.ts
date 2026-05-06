/**
 * Milestone Status Enum.
 *
 * Defines the various statuses for a booking milestone.
 *
 * @version 1
 * @since 1.0.0
 */
export enum MilestoneStatusEnum {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SKIPPED = 'skipped',
  /** Used for checklist items that have been filled in */
  COMPLETED = 'completed',
}
