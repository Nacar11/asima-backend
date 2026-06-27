import { ValueObject } from '@/utils/domain/value-object';
import { InvalidTimeWindowError } from '@/time-entries/domain/time-entry-errors';

/**
 * The punch window of a time entry: a `time_in` plus an optional `time_out`.
 * Cohesive invariant: when a `time_out` is present it must be **strictly after**
 * `time_in` (an open segment carries a null out). Homes the rule duplicated
 * today in the service's `create` / `update` / `applyCorrection`.
 *
 * `isOpen()` is the single source of the open/confirmed status derivation
 * (`status = isOpen() ? open : confirmed`, via `TimeEntry.deriveStatus`).
 *
 * Self-validating — an inconsistent window cannot exist anywhere. Pure TS: no
 * `@nestjs/*`, no `typeorm`. The error carries the default `time_out` field; a
 * call site needing the `proposed_time_out` label re-throws via
 * `TimeEntry.assertWindow`.
 */
export class TimeWindow extends ValueObject<{ time_in: Date; time_out: Date | null }> {
  constructor(time_in: Date, time_out: Date | null) {
    if (time_out && time_out <= time_in) {
      throw new InvalidTimeWindowError();
    }
    super({ time_in, time_out });
  }

  get time_in(): Date {
    return this.props.time_in;
  }

  get time_out(): Date | null {
    return this.props.time_out;
  }

  /** True while the segment is still open (no `time_out`). */
  isOpen(): boolean {
    return this.props.time_out == null;
  }
}
