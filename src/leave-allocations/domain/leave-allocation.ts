import { LeaveType } from '@/leave-requests/leave-requests.constants';
import { AllocationSource } from '@/leave-allocations/leave-allocations.constants';

/**
 * Leave-allocation domain record — one immutable row in the grant ledger, as
 * pure data. This is the read-path shape (what the assembler serializes) and
 * the mapper's `toDomain` output.
 *
 * `allowance(employee, type) = SUM(amount)` over non-deleted rows. Default
 * 10/10 land as `source='default'` rows; admin grants append `source=
 * 'admin_grant'`. Append-only: there is no update path, and `amount > 0`
 * (revocation = soft-delete a row, plan D7).
 *
 * Pure TS — no `@nestjs/*` (not even `@ApiProperty`), no `typeorm`. The
 * HTTP/Swagger shape lives in `dto/response/leave-allocation-response.dto.ts`;
 * the creation invariant lives on `leave-allocation.aggregate.ts`.
 */
export class LeaveAllocationRecord {
  id!: number;

  /** FK to users.id — the employee granted the days. */
  employee_id!: number;

  leave_type!: LeaveType;

  /** Days granted by this row (> 0). */
  amount!: number;

  source!: AllocationSource;

  reason!: string | null;

  /** users.id of the admin who granted this (null for system defaults). */
  granted_by!: number | null;

  created_by!: number | null;

  updated_by!: number | null;

  deleted_by!: number | null;

  created_at!: Date;

  updated_at!: Date;

  deleted_at!: Date | null;
}
