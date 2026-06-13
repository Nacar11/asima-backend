import { Injectable } from '@nestjs/common';
import { User } from '@/users/domain/user';
import { PAGINATION_DEFAULTS } from '@/utils/constants/api.constants';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { LeaveRequestsService } from '@/leave-requests/leave-requests.service';
import { LeaveRequest } from '@/leave-requests/domain/leave-request';
import { LEAVE_REQUEST_STATUSES } from '@/leave-requests/leave-requests.constants';
import { TimeCorrectionRequestsService } from '@/time-correction-requests/time-correction-requests.service';
import { TimeCorrectionRequest } from '@/time-correction-requests/domain/time-correction-request';
import { TIME_CORRECTION_STATUSES } from '@/time-correction-requests/time-correction-requests.constants';
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
    private readonly corrections: TimeCorrectionRequestsService,
    private readonly users: BaseUserRepository,
  ) {}

  async findPending(user: User, query: QueryPendingApprovalsDto): Promise<FindPendingApprovals> {
    const page = query.page ?? PAGINATION_DEFAULTS.page;
    const limit = Math.min(query.limit ?? PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);
    const seeAll = this.canSeeAll(user);

    let items: PendingApproval[] = [];

    if (!query.type || query.type === 'leave') {
      const leaves = seeAll
        ? await this.leave.findAllPending()
        : await this.leave.findInboxForApprover(user.id);
      items = items.concat(await this.mapLeaves(leaves));
    }

    if (!query.type || query.type === 'time_correction') {
      const tcs = seeAll
        ? await this.corrections.findAllPending()
        : await this.corrections.findInboxForApprover(user.id);
      items = items.concat(await this.mapCorrections(tcs));
    }

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

  private async mapCorrections(tcs: TimeCorrectionRequest[]): Promise<PendingApproval[]> {
    const names = await this.resolveNames(tcs.map((t) => t.employee_id));
    return tcs.map((t) => {
      const isL1 = t.status === TIME_CORRECTION_STATUSES.pending_l1;
      const item = new PendingApproval();
      item.id = t.id;
      item.kind = 'time_correction';
      item.employee_id = t.employee_id;
      item.employee_name = names.get(t.employee_id) ?? `User #${t.employee_id}`;
      item.requested_at = t.submitted_at;
      item.current_step = isL1 ? 1 : 2;
      item.current_approver_id = (isL1 ? t.l1_approver_id : t.l2_approver_id) ?? t.l1_approver_id;
      item.summary = `Time correction for ${t.work_date}`;
      // Raw times for the inbox in/out diff; original_* come from the joined
      // target entry (null for a new manual log). Frontend formats them.
      item.time_correction = {
        original_time_in: t.original_time_in,
        original_time_out: t.original_time_out,
        proposed_time_in: t.proposed_time_in,
        proposed_time_out: t.proposed_time_out,
        is_new_log: t.target_entry_id == null,
      };
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
