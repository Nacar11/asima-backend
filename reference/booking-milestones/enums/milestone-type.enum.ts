/**
 * Milestone type enumeration.
 *
 * Distinguishes between payment milestones and checklist items.
 *
 * - MILESTONE: Standard payment-based milestone for service delivery tracking
 * - CHECKLIST: Assessment checklist item that requires provider input/response
 *
 * @version 1
 * @since 1.0.0
 */
export enum MilestoneTypeEnum {
  /**
   * Standard payment milestone.
   * Tracks service delivery progress with payment release points.
   */
  MILESTONE = 'milestone',

  /**
   * Assessment checklist item.
   * Requires provider to input a response (checkbox, text, rating, photo, measurement).
   * Used during DPO assessment bookings.
   */
  CHECKLIST = 'checklist',
}
