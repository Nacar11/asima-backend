import { ValueObject } from '@/utils/domain/value-object';
import { InvalidWorkWindowError } from '@/work-schedules/domain/work-schedule-errors';

/**
 * The daily punch window of a work schedule: `expected_in` … `expected_out`
 * (zero-padded `HH:MM:SS` strings). Cohesive invariant: `expected_out` is
 * **strictly after** `expected_in`. Homes the rule duplicated today in the
 * service's `assertWindowOk`.
 *
 * Self-validating — an inconsistent window cannot exist anywhere. Pure TS: no
 * `@nestjs/*`, no `typeorm`. Lexicographic string comparison is correct for
 * zero-padded times, matching the legacy free function.
 */
export class WorkWindow extends ValueObject<{ expected_in: string; expected_out: string }> {
  constructor(expected_in: string, expected_out: string) {
    if (expected_out <= expected_in) {
      throw new InvalidWorkWindowError();
    }
    super({ expected_in, expected_out });
  }

  get expected_in(): string {
    return this.props.expected_in;
  }

  get expected_out(): string {
    return this.props.expected_out;
  }
}
