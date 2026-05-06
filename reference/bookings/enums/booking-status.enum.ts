/**
 * Booking status enumeration.
 *
 * Represents the lifecycle status of a service booking from creation to completion.
 *
 * @version 3
 * @since 1.0.0
 */
export enum BookingStatusEnum {
  PENDING = 'pending',
  /**
   * Payment was claimed by the customer and is awaiting seller/admin verification.
   */
  AWAITING_CONFIRMATION = 'awaiting_confirmation',
  /**
   * Preventive flow: Customer submitted form, waiting for provider quotation.
   * Booking created without sales_order_item_id.
   */
  AWAITING_QUOTATION = 'awaiting_quotation',
  CONFIRMED = 'confirmed',
  PROVIDER_ASSIGNED = 'provider_assigned',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  PENDING_REVIEW = 'pending_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  RESCHEDULE_REQUESTED = 'reschedule_requested',
}
