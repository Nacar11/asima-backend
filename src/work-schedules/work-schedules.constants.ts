/**
 * Days of week — ISO-ish (0 = Sunday, 6 = Saturday). Matches what most
 * date pickers and `Date.getDay()` emit, so frontend and seed can share
 * the convention with no translation table.
 *
 * Stored as a small int with a DB CHECK constraint (0..6). The mapper
 * casts on the way in/out — no enum table.
 */
export const DAY_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

export type DayOfWeek = (typeof DAY_OF_WEEK)[keyof typeof DAY_OF_WEEK];
