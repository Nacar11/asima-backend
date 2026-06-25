import { ValueObject } from '@/utils/domain/value-object';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * An inclusive calendar-date range `[start, end]`, both `YYYY-MM-DD`.
 * Self-validating: `end >= start` and both well-formed, so an invalid range
 * cannot exist. Shared across aggregates (leave, schedules, compensation).
 * Pure TS — no framework imports. ISO date strings compare lexicographically,
 * which equals chronological order, so no Date parsing is needed.
 */
export class DateRange extends ValueObject<{ start: string; end: string }> {
  constructor(start: string, end: string) {
    if (!ISO_DATE.test(start)) throw new Error(`Invalid start date: ${start}`);
    if (!ISO_DATE.test(end)) throw new Error(`Invalid end date: ${end}`);
    if (end < start) throw new Error(`DateRange end (${end}) is before start (${start}).`);
    super({ start, end });
  }

  get start(): string {
    return this.props.start;
  }

  get end(): string {
    return this.props.end;
  }

  isSingleDay(): boolean {
    return this.props.start === this.props.end;
  }

  /** True if the range's end is strictly before `date` (YYYY-MM-DD). */
  endsBefore(date: string): boolean {
    return this.props.end < date;
  }
}
