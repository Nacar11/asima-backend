import { Injectable } from '@nestjs/common';
import { User } from '@/users/domain/user';
import { PAGINATION_DEFAULTS } from '@/utils/constants/api.constants';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { LeaveRequestsService } from '@/leave-requests/leave-requests.service';
import { LeaveRequest } from '@/leave-requests/domain/leave-request';
import { LEAVE_REQUEST_STATUSES } from '@/leave-requests/leave-requests.constants';
import { FindPendingApprovals } from './domain/find-pending-approvals';
import { PendingApproval } from './domain/pending-approval';
import { QueryPendingApprovalsDto } from './dto/query-pending-approvals.dto';

/**
 * Cross-resource approvals inbox.
 *
 * `canSeeAll` splits the query into two shapes (ADR 0001 role/chain split):
 *   - true  → every pending row across the org (HR override or system_admin)
 *   - false → only rows where the caller is the current-step approver
 *
 * Phase 3 wires leave; time-correction joins the same shape in Phase 5.
 */
@Injectable()
export class ApprovalsService {
  constructor(
    private readonly leave: LeaveRequestsService,
    private readonly users: BaseUserRepository,
  ) {}

  async findPending(user: User, query: QueryPendingApprovalsDto): Promise<FindPendingApprovals> {
    const page = query.page ?? PAGINATION_DEFAULTS.page;
    const limit = Math.min(query.limit ?? PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);

    let items: PendingApproval[] = [];

    if (!query.type || query.type === 'leave') {
      const leaves = this.canSeeAll(user)
        ? await this.leave.findAllPending()
        : await this.leave.findInboxForApprover(user.id);
      items = items.concat(await this.mapLeaves(leaves));
    }
    // time_correction items are appended here in Phase 5.

    items.sort((a, b) => a.requested_at.getTime() - b.requested_at.getTime());

    const total = items.length;
    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);
    return { data, total, page, limit, has_more: page * limit < total };
  }

  private async mapLeaves(leaves: LeaveRequest[]): Promise<PendingApproval[]> {
    const names = await this.resolveNames(leaves.map((l) => l.employee_id));
    return leaves.map((l) => {
      const isL1 = l.status === LEAVE_REQUEST_STATUSES.pending_l1;
      const item = new PendingApproval();
      item.id = l.id;
      item.kind = 'leave';
      item.employee_id = l.employee_id;
      item.employee_name = names.get(l.employee_id) ?? `User #${l.employee_id}`;
      item.requested_at = l.submitted_at;
      item.current_step = isL1 ? 1 : 2;
      item.current_approver_id = (isL1 ? l.l1_approver_id : l.l2_approver_id) ?? l.l1_approver_id;
      item.summary = `${l.leave_type} leave, ${l.start_date} to ${l.end_date}`;
      return item;
    });
  }

  /** Resolve unique employee_ids to "First Last" display names in one pass. */
  private async resolveNames(ids: number[]): Promise<Map<number, string>> {
    const unique = [...new Set(ids)];
    const map = new Map<number, string>();
    await Promise.all(
      unique.map(async (id) => {
        const u = await this.users.findById(id);
        if (u) map.set(id, `${u.first_name} ${u.last_name}`);
      }),
    );
    return map;
  }

  /**
   * Exposed (not `private`) so the unit test can assert input → branch
   * mapping without going through the full data path.
   */
  canSeeAll(user: User): boolean {
    if (user.system_admin === true) return true;
    const codes = user.role?.permissions?.map((p) => p.code) ?? [];
    return codes.includes('APPROVAL:ApproveAny');
  }
}
