import { LeaveType } from '@/leave-requests/leave-requests.constants';

/**
 * Per-type leave balance for one employee — a computed read-model, not a
 * stored row. `allowance` is `SUM(leave_allocations.amount)`; `used` and
 * `reserved` are `SUM(leave_requests.working_days)` over approved and pending
 * requests respectively (reserve-on-submit). One per leave type is always
 * returned, including types with no grants (allowance 0).
 *
 * Pure TS — the HTTP/Swagger shape lives in
 * `dto/response/leave-balance-response.dto.ts`.
 */
export class LeaveBalance {
  leave_type!: LeaveType;

  /** SUM of granted days (ledger). */
  allowance!: number;

  /** Working days locked in by APPROVED requests. */
  used!: number;

  /** Working days held by PENDING requests. */
  reserved!: number;

  /** allowance − used − reserved (floored at 0). */
  available!: number;
}
