/**
 * Pure domain errors raised by the `WorkSchedule` aggregate and its `WorkWindow`
 * / `Break` value objects. The aggregate stays framework-free (no `@nestjs/*`);
 * the use-case (and the schedule-change cascade's `validate`) maps each of these
 * to the exact HTTP exception the service threw before the DDD migration
 * (decision #8), so the wire contract is unchanged:
 *
 *   InvalidWorkWindowError (field 'expected_out') → unprocessable('expected_out', …) 422
 *   InvalidBreakError (carries field)             → unprocessable(err.field, …)       422
 */

/** `expected_out` is not strictly after `expected_in`. */
export class InvalidWorkWindowError extends Error {
  readonly field = 'expected_out';

  constructor() {
    super('expected_out must be strictly after expected_in');
    this.name = 'InvalidWorkWindowError';
  }
}

/**
 * A break invariant was violated. `field` discriminates the 422 envelope key
 * and the message varies by rule, so both are carried explicitly (unlike
 * `InvalidWorkWindowError`, which has a single message):
 *
 *   ('break_minutes', 'break_minutes must be >= 0')
 *   ('break_start',   'break_start is required when break_minutes > 0')
 *   ('break_start',   'break_start must be on or after expected_in')      // aggregate cross-VO
 *   ('break_start',   'the break must end on or before expected_out')     // aggregate cross-VO
 */
export class InvalidBreakError extends Error {
  constructor(
    readonly field: 'break_minutes' | 'break_start',
    message: string,
  ) {
    super(message);
    this.name = 'InvalidBreakError';
  }
}
