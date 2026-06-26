import { ValueObject } from '@/utils/domain/value-object';
import { InvalidAllocationAmountError } from '@/leave-allocations/domain/leave-allocation-errors';

/**
 * Days granted by a single ledger row. A grant only ever ADDS days, so the
 * amount is a positive whole number — the column is `integer NOT NULL` with a
 * DB `CHECK (amount > 0)`, and revocation is a soft-delete (never a negative
 * grant). Self-validating, so a nonsensical amount cannot exist. Pure TS.
 *
 * The `[1, 365]` upper bound is a fat-finger guardrail enforced at the DTO,
 * not a domain invariant (plan decision #3).
 */
export class AllocationAmount extends ValueObject<{ value: number }> {
  constructor(value: number) {
    if (!Number.isInteger(value)) {
      throw new InvalidAllocationAmountError(`Allocation amount must be a whole number: ${value}`);
    }
    if (value <= 0) {
      throw new InvalidAllocationAmountError(`Allocation amount must be greater than 0: ${value}`);
    }
    super({ value });
  }

  get value(): number {
    return this.props.value;
  }
}
