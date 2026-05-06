/**
 * Checklist response type enumeration.
 *
 * Defines the type of input expected for a checklist item.
 * Used by both service_milestone_templates and booking_milestones.
 *
 * @version 1
 * @since 1.0.0
 */
export enum ChecklistResponseTypeEnum {
  /**
   * Simple yes/no or pass/fail checkbox.
   * Stored in checkbox_value field.
   */
  CHECKBOX = 'checkbox',

  /**
   * Free-form text input.
   * Stored in text_value field.
   */
  TEXT = 'text',

  /**
   * Numeric rating (e.g., 1-5 stars or 1-10 scale).
   * Stored in rating_value field.
   */
  RATING = 'rating',

  /**
   * Photo upload(s) as evidence.
   * Stored in photo_urls field (jsonb array).
   */
  PHOTO = 'photo',

  /**
   * Numeric measurement with unit.
   * Stored in measurement_value and measurement_unit fields.
   */
  MEASUREMENT = 'measurement',
}
