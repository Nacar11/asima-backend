import { ValueObject } from '@/utils/domain/value-object';
import { InvalidProposedWindowError } from '@/time-correction-requests/domain/time-correction-request-errors';

/**
 * The proposed punch window of a correction: a `time_in` plus an optional
 * `time_out`. Cohesive invariant: when a `time_out` is present it must be
 * **strictly after** `time_in` (an open segment carries a null out). Homes the
 * rule duplicated today in the service's `submit` and `update`.
 *
 * Self-validating — an inconsistent window cannot exist anywhere. Pure TS. The
 * thrown message is verbatim the legacy service string so the 422 envelope
 * stays byte-identical.
 */
export class ProposedPunch extends ValueObject<{ time_in: Date; time_out: Date | null }> {
  constructor(time_in: Date, time_out: Date | null) {
    if (time_out && time_out <= time_in) {
      throw new InvalidProposedWindowError(
        'proposed_time_out must be strictly after proposed_time_in.',
      );
    }
    super({ time_in, time_out });
  }

  get time_in(): Date {
    return this.props.time_in;
  }

  get time_out(): Date | null {
    return this.props.time_out;
  }
}
