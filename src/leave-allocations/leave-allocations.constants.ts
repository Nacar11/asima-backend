/**
 * Leave-allocation enums. The `leave_allocations` table is an append-only
 * ledger: each row GRANTS `amount` days of a leave type to an employee, and
 * an employee's allowance for a type is `SUM(amount)`. Grants only ever add
 * (DB `CHECK (amount > 0)`); to revoke, soft-delete the specific row — never
 * a negative amount (plan D7).
 */
export const ALLOCATION_SOURCES = {
  /** The 10 sick / 10 vacation every employee starts with (seed + create). */
  default: 'default',
  /** An HR/admin grant via POST /admin/users/:id/leave-allocations. */
  admin_grant: 'admin_grant',
} as const;

export type AllocationSource = (typeof ALLOCATION_SOURCES)[keyof typeof ALLOCATION_SOURCES];
