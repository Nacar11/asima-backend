import { ValueObject } from '@/utils/domain/value-object';

/**
 * Chargeable leave days. Non-negative and always a multiple of 0.5 (the DB
 * stores `numeric(4,1)`; a half-day request charges 0.5). Self-validating, so
 * a nonsensical duration (negative, or 0.3 days) cannot exist. Pure TS.
 */
export class LeaveDuration extends ValueObject<{ days: number }> {
  constructor(days: number) {
    if (days < 0) throw new Error(`LeaveDuration cannot be negative: ${days}`);
    if (!Number.isInteger(days * 2)) {
      throw new Error(`LeaveDuration must be a multiple of 0.5: ${days}`);
    }
    super({ days });
  }

  get days(): number {
    return this.props.days;
  }

  isHalfDay(): boolean {
    return this.props.days === 0.5;
  }
}
