/**
 * Pure domain errors raised by the `TimeEntry` aggregate and its `TimeWindow`
 * value object. The aggregate stays framework-free (no `@nestjs/*`); the
 * use-case maps each of these to the exact HTTP exception the service threw
 * before the DDD migration (decision #8), so the wire contract is unchanged:
 *
 *   InvalidTimeWindowError (carries `field`) → unprocessable(err.field, …)  422
 */

/**
 * `time_out` is not strictly after `time_in`. `field` discriminates which 422
 * envelope key the use-case maps to — `'time_out'` for create/update,
 * `'proposed_time_out'` for `applyCorrection`. The message is derived from
 * `field` so both verbatim legacy strings (`<field> must be strictly after
 * <in-field>`) come from a single home (`field.replace(/_out$/, '_in')` turns
 * `time_out`→`time_in` and `proposed_time_out`→`proposed_time_in`).
 */
export class InvalidTimeWindowError extends Error {
  readonly field: string;

  constructor(field = 'time_out') {
    super(`${field} must be strictly after ${field.replace(/_out$/, '_in')}`);
    this.name = 'InvalidTimeWindowError';
    this.field = field;
  }
}
