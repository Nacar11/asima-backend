import { Injectable } from '@nestjs/common';
import { User } from '@/users/domain/user';
import { PAGINATION_DEFAULTS } from '@/utils/constants/api.constants';
import { FindPendingApprovals } from './domain/find-pending-approvals';
import { QueryPendingApprovalsDto } from './dto/query-pending-approvals.dto';

/**
 * Cross-resource approvals inbox.
 *
 * v0 returns an empty paginated payload because `approval_chains`,
 * `leave_requests`, and `time_correction_requests` don't exist yet —
 * the leave module will land them. The permission/branching logic IS
 * real, so when the data lands only the data-fetching code changes.
 *
 * `canSeeAll` splits the future query into two shapes:
 *   - true  → fetch every pending row across the org (HR override or system_admin)
 *   - false → fetch only rows where current_approver_id === user.id
 *
 * See spec `docs/plans/2026-05-25-approvals-page-and-role-sidebar.md` §4.4
 * and ADR 0001 for the role/chain split.
 */
@Injectable()
export class ApprovalsService {
  async findPending(user: User, query: QueryPendingApprovalsDto): Promise<FindPendingApprovals> {
    const canSeeAll = this.canSeeAll(user);

    // Branch is wired now so the leave module only adds the data fetch,
    // not the permission split. Both arms currently return empty.
    void canSeeAll;

    const page = query.page ?? PAGINATION_DEFAULTS.page;
    const limit = Math.min(query.limit ?? PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);

    return { data: [], total: 0, page, limit, has_more: false };
  }

  /**
   * Exposed (not `private`) so the unit test can assert input → branch
   * mapping without going through the full empty-payload return path.
   * If the leave module later wants to gate sub-queries on this, the
   * service is the right home — not a duplicated check in the controller.
   */
  canSeeAll(user: User): boolean {
    if (user.system_admin === true) return true;
    const codes = user.role?.permissions?.map((p) => p.code) ?? [];
    return codes.includes('APPROVAL:ApproveAny');
  }
}
