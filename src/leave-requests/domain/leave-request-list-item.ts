import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveRequest } from '@/leave-requests/domain/leave-request';

/**
 * List read-model: a leave request plus the requester's display name,
 * resolved by a join at query time. Kept separate from the `LeaveRequest`
 * audit entity (which stays a pure persisted record) — same split as
 * `EmployeeChainView` in the approval-chains module, so the HR table
 * needs no second round-trip to resolve names.
 *
 * `employee_name` is null only if the join misses (e.g. a hard-deleted
 * user); requests normally always resolve a name.
 */
export class LeaveRequestListItem extends LeaveRequest {
  @ApiPropertyOptional({ example: 'Ada Lovelace', nullable: true })
  employee_name!: string | null;

  /** L1 approver display name, joined at query time. Null if since deactivated. */
  @ApiPropertyOptional({ example: 'Grace Hopper', nullable: true })
  l1_approver_name!: string | null;

  /** L2 approver display name; null when the chain has no L2 or the user is gone. */
  @ApiPropertyOptional({ example: 'Alan Turing', nullable: true })
  l2_approver_name!: string | null;

  /** Decider display name (chain approver or HR override); null until decided. */
  @ApiPropertyOptional({ example: 'Edsger Dijkstra', nullable: true })
  decided_by_name!: string | null;
}
