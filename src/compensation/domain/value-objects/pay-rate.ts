import { ValueObject } from '@/utils/domain/value-object';
import { deriveHourlyRate } from '@/compensation/compensation.constants';
import { InvalidPayRateError } from '@/compensation/domain/compensation-errors';

/**
 * The money rule of a compensation row: a canonical `monthly_salary`, the
 * `hourly_rate` derived from it (or manually overridden), and the
 * `hourly_rate_is_overridden` flag recording which. Homes the
 * derivation+override logic the service duplicated across `insertWithin`
 * (create) and `update` (correction).
 *
 * Invariants (fail-fast on a corrupt persisted row at `reconstitute`, like the
 * other VOs): `monthly_salary >= 0` and `hourly_rate >= 0`. The DTO owns the
 * real positivity bound at the edge (400 before this is reached); this is the
 * domain's last line against a bad row.
 *
 * Self-validating, immutable. Pure TS: no `@nestjs/*`, no `typeorm`.
 */
export class PayRate extends ValueObject<{
  monthly_salary: number;
  hourly_rate: number;
  hourly_rate_is_overridden: boolean;
}> {
  constructor(monthly_salary: number, hourly_rate: number, hourly_rate_is_overridden: boolean) {
    if (monthly_salary < 0) {
      throw new InvalidPayRateError('monthly_salary', 'monthly_salary must be >= 0');
    }
    if (hourly_rate < 0) {
      throw new InvalidPayRateError('hourly_rate', 'hourly_rate must be >= 0');
    }
    super({ monthly_salary, hourly_rate, hourly_rate_is_overridden });
  }

  /**
   * Build a `PayRate` from raw input: an explicit `hourly_rate` is used verbatim
   * and flagged overridden; otherwise the rate is derived from `monthly_salary`
   * and not overridden. Mirrors the create path's `!= null` test, so a `null`
   * (or omitted) `hourly_rate` derives.
   */
  static fromInput(monthly_salary: number, hourly_rate?: number | null): PayRate {
    const overridden = hourly_rate != null;
    const resolved = overridden ? hourly_rate : deriveHourlyRate(monthly_salary);
    return new PayRate(monthly_salary, resolved, overridden);
  }

  get monthly_salary(): number {
    return this.props.monthly_salary;
  }

  get hourly_rate(): number {
    return this.props.hourly_rate;
  }

  get hourly_rate_is_overridden(): boolean {
    return this.props.hourly_rate_is_overridden;
  }
}
