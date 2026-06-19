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

/**
 * Today's date as `YYYY-MM-DD` in the business timezone (Asia/Manila in prod,
 * overridable via `APP_TIMEZONE`). This is the "today" the leave date-rules
 * use (`LeaveDayCountService.today()`); the schedule-change cascade reuses it
 * so its temporal comparisons line up with leave/correction dates.
 */
export function businessDateString(date: Date = new Date()): string {
  const tz = process.env.APP_TIMEZONE ?? 'Asia/Manila';
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date);
}

/**
 * Weekday (0 = Sunday … 6 = Saturday) of a `YYYY-MM-DD` string. Parses the
 * date as UTC midnight so the weekday is independent of the host timezone —
 * the same convention `work_schedules.day_of_week` and the leave day-count use.
 */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** The calendar day before a `YYYY-MM-DD` string, as `YYYY-MM-DD` (UTC math). */
export function dayBefore(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Every calendar date in the inclusive range `[start, end]`, as `YYYY-MM-DD`. */
export function datesInRange(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cur <= last) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}
