/**
 * Server-clock date helpers. The app attributes punches and the
 * "today" comparisons in the timesheet flows to the UTC calendar date —
 * overnight shifts that span midnight UTC stay on the punch-in's UTC day
 * (matches the `work_date` schema note).
 *
 * For the *business-timezone* "today" used by the leave date-rules
 * (Asia/Manila in prod), see `LeaveDayCountService.today()` — that is a
 * deliberately different concept and not interchangeable with this.
 */

/** A `Date` as a UTC `YYYY-MM-DD` string. Defaults to the current instant. */
export function utcDateString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
