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

/**
 * `decision_note` stamped on a leave / time-correction request that the
 * schedule-change cascade auto-cancels. Records *why* the request was closed
 * and on what change, so the audit trail explains a system-initiated cancel.
 */
export function scheduleChangeCancelNote(day_of_week: DayOfWeek, effective_from: string): string {
  return `auto-cancelled: schedule changed (weekday ${day_of_week}, effective ${effective_from})`;
}

/** Pending statuses shared by leave and time-correction requests (identical vocab). */
export const CASCADE_PENDING_STATUSES = ['pending_l1', 'pending_l2'] as const;
export const CASCADE_APPROVED_STATUS = 'approved' as const;
