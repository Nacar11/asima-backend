/**
 * Service location type enumeration.
 *
 * Determines where the service is delivered: at the customer's location,
 * at the provider's location, both (customer chooses), or remotely.
 *
 * Replaces the `is_remote_available` boolean field.
 *
 * @version 1
 * @since 1.1.0
 */
export enum ServiceLocationTypeEnum {
  /** Provider travels to customer's location (replaces is_remote_available = false) */
  HOME_SERVICE = 'home_service',
  /** Customer travels to provider's location */
  WALK_IN = 'walk_in',
  /** Service supports both home service and walk-in; customer chooses */
  BOTH = 'both',
  /** No physical location needed — virtual/online service (replaces is_remote_available = true) */
  REMOTE = 'remote',
}
