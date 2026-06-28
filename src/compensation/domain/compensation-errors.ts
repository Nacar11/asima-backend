import { FieldValidationError } from '@/utils/domain/field-validation-error';

/**
 * Pure domain errors raised by the `Compensation` aggregate and its `PayRate`
 * value object. They extend the shared `FieldValidationError`, so the use-case
 * maps them to 422 via the shared `rethrowFieldValidationError` — the same
 * exact HTTP exception the service threw before the DDD migration (decision #8),
 * so the wire contract is unchanged:
 *
 *   FutureEffectiveDateError       → unprocessable('effective_from', …)  422
 *   InvalidPayRateError (carries field) → unprocessable(err.field, …)    422
 */

/** `effective_from` is dated after today — a future-dated rate is rejected. */
export class FutureEffectiveDateError extends FieldValidationError {
  readonly field = 'effective_from';

  constructor() {
    super('effective_from cannot be in the future');
    this.name = 'FutureEffectiveDateError';
  }
}

/**
 * A pay-rate invariant was violated. `field` discriminates the 422 envelope key
 * (`monthly_salary` or `hourly_rate`); the message varies by rule, so both are
 * carried explicitly:
 *
 *   ('monthly_salary', 'monthly_salary must be >= 0')
 *   ('hourly_rate',    'hourly_rate must be >= 0')
 */
export class InvalidPayRateError extends FieldValidationError {
  constructor(
    readonly field: 'monthly_salary' | 'hourly_rate',
    message: string,
  ) {
    super(message);
    this.name = 'InvalidPayRateError';
  }
}
