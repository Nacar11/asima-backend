/**
 * Rating Type Enum.
 *
 * Defines the different types of rating input methods.
 *
 * @version 1
 * @since 1.0.0
 */
export enum RatingTypeEnum {
  /** 1-5 star rating */
  STARS = 'stars',
  /** 1-10 scale rating */
  SCALE = 'scale',
  /** Thumbs up/down (binary) */
  THUMBS = 'thumbs',
  /** 0-100 percentage rating */
  PERCENTAGE = 'percentage',
}
