/**
 * Compensation module constants + the monthly→hourly derivation.
 *
 * `monthly_salary` is the canonical figure HR enters; `hourly_rate` is
 * derived from it (and may be overridden per row). The divisor is the
 * standard number of paid hours per month — a **policy number**, kept in
 * one place and env-overridable so changing the convention never touches
 * logic. Default 208.67 = (313 working days × 8h) ÷ 12 months, a common
 * PH "factor 313" basis.
 *
 * Pure module — no `@nestjs/*` runtime imports, so it's trivially unit
 * testable and importable from the service and seeds alike.
 */
export const COMPENSATION_MONTHLY_HOURS_DIVISOR = Number(
  process.env.COMPENSATION_MONTHLY_HOURS_DIVISOR ?? 208.67,
);

/** Decimal places kept on a derived hourly rate (matches the numeric(12,4) column). */
export const HOURLY_RATE_SCALE = 4;

/**
 * Single company currency. Single-tenant, so this is a display constant —
 * NOT a per-row column (YAGNI). Surface it on read payloads if the UI
 * needs to render a symbol.
 */
export const COMPENSATION_CURRENCY = 'PHP';

/**
 * Derive an hourly rate from a monthly salary, rounded to
 * `HOURLY_RATE_SCALE` places. The stored `hourly_rate` is concrete (we do
 * NOT compute on read) so later OT pay stays stable if the divisor policy
 * changes — historical rows keep the rate that was in effect.
 */
export function deriveHourlyRate(monthly_salary: number): number {
  const factor = 10 ** HOURLY_RATE_SCALE;
  return Math.round((monthly_salary / COMPENSATION_MONTHLY_HOURS_DIVISOR) * factor) / factor;
}
