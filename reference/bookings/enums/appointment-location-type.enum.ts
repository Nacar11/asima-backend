/**
 * Appointment location type enumeration.
 *
 * Per-booking record of what the customer chose for the service delivery location.
 * A service may support `both` (home + walk-in), but a specific booking resolves to exactly one.
 *
 * @version 1
 * @since 1.1.0
 */
export enum AppointmentLocationTypeEnum {
  /** Provider goes to customer's address */
  HOME_SERVICE = 'home_service',
  /** Customer goes to provider's service location */
  WALK_IN = 'walk_in',
  /** Virtual/online — no physical location */
  REMOTE = 'remote',
}
