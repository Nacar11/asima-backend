import { Injectable } from '@nestjs/common';
import { User } from '@/users/domain/user';
import { hasPermission } from '@/users/domain/user-permissions';
import { paginate, resolvePaging } from '@/utils/helpers/pagination';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { LeaveRequestsService } from '@/leave-requests/leave-requests.service';
import { LeaveRequestRecord } from '@/leave-requests/domain/leave-request';
import { LEAVE_REQUEST_STATUSES } from '@/leave-requests/leave-requests.constants';
import { TimeCorrectionRequestsService } from '@/time-correction-requests/time-correction-requests.service';
import { TimeCorrectionRequestRecord } from '@/time-correction-requests/domain/time-correction-request';
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
    const paging = resolvePaging(query);
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
    const data = items.slice(paging.skip, paging.skip + paging.limit);
    return paginate(data, total, paging);
  }

  private async mapLeaves(leaves: LeaveRequestRecord[]): Promise<PendingApproval[]> {
    const approverIdOf = (l: LeaveRequestRecord) =>
      (l.status === LEAVE_REQUEST_STATUSES.pending_l1 ? l.l1_approver_id : l.l2_approver_id) ??
      l.l1_approver_id;
    // Resolve employee + current-approver names in one findByIds (no N+1).
    const names = await this.resolveNames([
      ...leaves.map((l) => l.employee_id),
      ...leaves.map(approverIdOf),
    ]);
    return leaves.map((l) => {
      const isL1 = l.status === LEAVE_REQUEST_STATUSES.pending_l1;
      const approverId = approverIdOf(l);
      const item = new PendingApproval();
      item.id = l.id;
      item.kind = 'leave';
      item.employee_id = l.employee_id;
      item.employee_name = names.get(l.employee_id) ?? `User #${l.employee_id}`;
      item.requested_at = l.submitted_at;
      item.current_step = isL1 ? 1 : 2;
      item.current_approver_id = approverId;
      item.current_approver_name = names.get(approverId) ?? `User #${approverId}`;
      item.summary = `${l.leave_type} leave, ${l.start_date} to ${l.end_date}`;
      return item;
    });
  }

  private async mapCorrections(tcs: TimeCorrectionRequestRecord[]): Promise<PendingApproval[]> {
    const approverIdOf = (t: TimeCorrectionRequestRecord) =>
      (t.status === TIME_CORRECTION_STATUSES.pending_l1 ? t.l1_approver_id : t.l2_approver_id) ??
      t.l1_approver_id;
    // Resolve employee + current-approver names in one findByIds (no N+1).
    const names = await this.resolveNames([
      ...tcs.map((t) => t.employee_id),
      ...tcs.map(approverIdOf),
    ]);
    return tcs.map((t) => {
      const isL1 = t.status === TIME_CORRECTION_STATUSES.pending_l1;
      const approverId = approverIdOf(t);
      const item = new PendingApproval();
      item.id = t.id;
      item.kind = 'time_correction';
      item.employee_id = t.employee_id;
      item.employee_name = names.get(t.employee_id) ?? `User #${t.employee_id}`;
      item.requested_at = t.submitted_at;
      item.current_step = isL1 ? 1 : 2;
      item.current_approver_id = approverId;
      item.current_approver_name = names.get(approverId) ?? `User #${approverId}`;
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

  /** Resolve unique employee_ids to "First Last" display names in one query. */
  private async resolveNames(ids: number[]): Promise<Map<number, string>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();
    const users = await this.users.findByIds(unique);
    return new Map(users.map((u) => [u.id, `${u.first_name} ${u.last_name}`]));
  }

  /**
   * Exposed (not `private`) so the unit test can assert input → branch
   * mapping without going through the full data path.
   */
  canSeeAll(user: User): boolean {
    if (user.system_admin === true) return true;
    return hasPermission(user, 'APPROVAL:ApproveAny');
  }
}
