import { LeaveRequestRecord } from '@/leave-requests/domain/leave-request';

/**
 * List read-model: a leave request plus display names resolved by a join at
 * query time. Kept separate from the `LeaveRequestRecord` audit record so the
 * HR table needs no second round-trip to resolve names.
 *
 * `*_name` fields are null only if the join misses (e.g. a hard-deleted user).
 * Pure TS — the HTTP/Swagger shape lives in
 * `dto/response/leave-request-list-item-response.dto.ts`.
 */
export class LeaveRequestListItem extends LeaveRequestRecord {
  employee_name!: string | null;

  /** L1 approver display name, joined at query time. Null if since deactivated. */
  l1_approver_name!: string | null;

  /** L2 approver display name; null when the chain has no L2 or the user is gone. */
  l2_approver_name!: string | null;

  /** Decider display name (chain approver or HR override); null until decided. */
  decided_by_name!: string | null;
}
