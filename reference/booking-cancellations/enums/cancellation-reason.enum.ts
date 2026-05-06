/**
 * Cancellation Reason Enum.
 *
 * Defines the reason for cancellation.
 *
 * @version 1
 * @since 1.0.0
 */
export enum CancellationReasonEnum {
  SCHEDULE_CONFLICT = 'schedule_conflict',
  EMERGENCY = 'emergency',
  PROVIDER_UNAVAILABLE = 'provider_unavailable',
  CUSTOMER_NO_SHOW = 'customer_no_show',
  WEATHER = 'weather',
  ILLNESS = 'illness',
  CHANGED_MIND = 'changed_mind',
  FOUND_ALTERNATIVE = 'found_alternative',
  PRICE_DISAGREEMENT = 'price_disagreement',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  DUPLICATE_BOOKING = 'duplicate_booking',
  OTHER = 'other',
}
