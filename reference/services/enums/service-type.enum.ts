/**
 * Service type enumeration.
 *
 * Distinguishes between general, standard preventive, and assessment (DPO) services.
 *
 * @version 2
 * @since 1.0.0
 */
export enum ServiceTypeEnum {
  /**
   * Standard service with fixed pricing (maintenance/preventive).
   * Typically used with `requires_quote = true`.
   * Customer requests a quote, provider quotes, customer pays, milestones tracked.
   */
  STANDARD = 'standard',

  /**
   * Assessment/diagnostic service (DPO flow).
   * Customer pays assessment fee, provider performs inspection with checklist,
   * then generates a quotation with itemized services/materials.
   * Used with `requires_quote = false`.
   */
  ASSESSMENT = 'assessment',

  /**
   * General service — simplest booking flow.
   * Customer pays base price upfront, provider confirms and delivers.
   * No quotation, no checklist, no milestones.
   * Used with `requires_quote = false`.
   */
  GENERAL = 'general',

  /**
   * Venue/facility rental service — court, room, or space rental.
   * Customer selects time slots, pays hourly rate × duration (with optional peak pricing).
   * Multiple concurrent bookings per service via `venue_capacity`.
   * Auto-completes when scheduled end time passes.
   * Used with `requires_quote = false`, `pricing_type = 'hourly'`, `service_location_type = 'walk_in'`.
   */
  VENUE = 'venue',
}
