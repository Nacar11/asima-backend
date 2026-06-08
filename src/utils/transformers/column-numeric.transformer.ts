import { ValueTransformer } from 'typeorm';

/**
 * Postgres `numeric`/`decimal` columns are returned as **strings** by the
 * `pg` driver (to avoid silently truncating values that don't fit a JS
 * float). That's correct for the driver but wrong for our domain, which
 * treats these as numbers (e.g. `leave_requests.working_days = 0.5`).
 *
 * This transformer parses the string back to a `number` on the way out and
 * leaves the value untouched on the way in (node-postgres serializes a JS
 * number to the column type fine). Without it, balance math would
 * string-concatenate (`"10" - "0.5"` style bugs).
 */
export class ColumnNumericTransformer implements ValueTransformer {
  to(value: number | null | undefined): number | null | undefined {
    return value;
  }

  from(value: string | null | undefined): number | null | undefined {
    return value == null ? (value as null | undefined) : Number(value);
  }
}
