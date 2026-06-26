import { AllocationAmount } from '@/leave-allocations/domain/value-objects/allocation-amount';

/**
 * Leave-allocation aggregate root — one row in the append-only grant ledger.
 *
 * The ledger has NO mutation (no update/revoke endpoint; revocation is a
 * soft-delete), so the aggregate carries only the **creation invariant**: a
 * pure static guard that the granted amount is a positive whole number. There
 * is deliberately no event buffer, no `reconstitute`, and it does not extend
 * `AggregateRoot` — there is nothing to load-mutate-save. The creation event is
 * built and published by the use-case post-commit with the DB-generated id,
 * mirroring `leave-requests` submit (plan decisions #2/#4).
 *
 * `leave_type` (enum) and `source` (server-set to `admin_grant`) are validated
 * at the DTO and set in the use-case respectively, so the only invariant that
 * needs a domain home is the amount.
 *
 * Pure TS — no `@nestjs/*`, no `typeorm`.
 */
export class LeaveAllocation {
  /**
   * Creation invariant for a grant: the amount must be a positive whole number.
   * Returns the validated `AllocationAmount` so the use-case persists the parsed
   * value (the VO is load-bearing, not a discarded validator). Throws
   * `InvalidAllocationAmountError` (mapped to 422 by the use-case).
   */
  static assertGrantable(amount: number): AllocationAmount {
    return new AllocationAmount(amount);
  }
}
