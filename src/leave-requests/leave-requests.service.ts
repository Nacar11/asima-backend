import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseLeaveRequestRepository } from '@/leave-requests/persistence/base-leave-request.repository';
import {
  LeaveDayCountService,
  SubmittableRange,
} from '@/leave-requests/leave-day-count.service';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { ApprovalChainsService } from '@/approval-chains/approval-chains.service';
import { LeaveRequest } from '@/leave-requests/domain/leave-request';
import { LeaveRequestSearchCriteria } from '@/leave-requests/domain/leave-request-search-criteria';
import { FindAllLeaveRequest } from '@/leave-requests/domain/find-all-leave-request';
import { SubmitLeaveInput, UpdateLeaveInput } from '@/leave-requests/domain/leave-request-inputs';
import { User } from '@/users/domain/user';
import {
  DAY_PORTIONS,
  DayPortion,
  DECISION_PATHS,
  LEAVE_REQUEST_STATUSES,
  LeaveRequestStatus,
  LeaveType,
} from '@/leave-requests/leave-requests.constants';

/**
 * Leave-request service — owns the request lifecycle and the 2-step
 * approval state machine (plan §3.2, §8). Authorization is two checks:
 * the route's `@Permissions` gate (role capability), then the
 * service-layer `canActOn` (chain placement OR ApproveAny / system_admin).
 * See ADR 0001 for why these axes are orthogonal.
 */
@Injectable()
export class LeaveRequestsService {
  constructor(
    private readonly repository: BaseLeaveRequestRepository,
    private readonly chains: ApprovalChainsService,
    private readonly users: BaseUserRepository,
    private readonly dayCount: LeaveDayCountService,
    private readonly allocations: BaseLeaveAllocationRepository,
    private readonly dataSource: DataSource,
  ) {}

  findAll(criteria: LeaveRequestSearchCriteria): Promise<FindAllLeaveRequest> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<LeaveRequest> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`LeaveRequest with id ${id} not found`);
    return row;
  }

  /**
   * Detail view with access control: the requester, either snapshotted
   * approver, a `LEAVE:ViewAll` holder, or `system_admin` may read it.
   */
  async findByIdForViewer(id: number, caller: User): Promise<LeaveRequest> {
    const row = await this.findById(id);
    const allowed =
      caller.id === row.employee_id ||
      caller.id === row.l1_approver_id ||
      caller.id === row.l2_approver_id ||
      caller.system_admin === true ||
      hasPermission(caller, 'LEAVE:ViewAll');
    if (!allowed) {
      throw new ForbiddenException('You are not allowed to view this leave request');
    }
    return row;
  }

  /**
   * Submit a leave request for `input.employee_id`. Snapshots the active
   * approval chain; hard-blocks if no L1 is assigned (Q1) and if the dates
   * overlap an existing pending/approved request (Q4).
   */
  async submit(input: SubmitLeaveInput, actor: User): Promise<LeaveRequest> {
    // D8: end >= start, no past dates, start & end must be scheduled
    // workdays. Returns the schedule-aware working-day count, snapshotted
    // onto the request so balance reserve/use math stays stable.
    const day_portion = input.day_portion ?? DAY_PORTIONS.full;
    const { working_days, start_time, end_time } = await this.dayCount.assertSubmittableRange(
      input.employee_id,
      input.start_date,
      input.end_date,
      day_portion,
      input.leave_type,
    );

    const chain = await this.chains.getActive(input.employee_id);
    if (chain.l1_approver_id == null) {
      throw unprocessable('approval_chain', 'No approver assigned. Contact HR.');
    }
    // Capture the narrowed (non-null) value — TS loses the narrowing inside
    // the transaction closure below.
    const l1_approver_id = chain.l1_approver_id;
    const l2_approver_id = chain.l2_approver_id;

    const overlaps = await this.repository.findOverlapping(
      input.employee_id,
      input.start_date,
      input.end_date,
    );
    if (overlaps.length > 0) {
      throw unprocessable('dates', `Overlaps existing request #${overlaps[0].id}.`);
    }

    // Reserve-on-submit (plan C3): inside one transaction, lock this
    // (employee, type)'s allocation rows FOR UPDATE, then check
    // available = allowance − (used + reserved). The lock serializes
    // concurrent same-type submits, so two can't both pass the check.
    return this.dataSource.transaction(async (manager) => {
      const allowance = await this.allocations.sumForUpdate(
        manager,
        input.employee_id,
        input.leave_type,
      );
      const consumed = await this.repository.sumConsumedForEmployeeType(
        manager,
        input.employee_id,
        input.leave_type,
      );
      const available = allowance - consumed;
      if (available < working_days) {
        throw unprocessable(
          'balance',
          `Only ${available} day(s) of ${input.leave_type} leave available; this request needs ${working_days}.`,
        );
      }

      return this.repository.create(
        {
          employee_id: input.employee_id,
          leave_type: input.leave_type,
          start_date: input.start_date,
          end_date: input.end_date,
          working_days,
          day_portion,
          start_time,
          end_time,
          reason: input.reason ?? null,
          status: LEAVE_REQUEST_STATUSES.pending_l1,
          l1_approver_id,
          l2_approver_id,
          created_by: actor.id,
        },
        manager,
      );
    });
  }

  /**
   * Preview the chargeable working days for a prospective request, running the
   * same D8 date rules as submit. Throws the same per-field 422 on a past date
   * or non-workday boundary, so the apply drawer validates exactly as submit.
   */
  async previewWorkingDays(
    employee_id: number,
    start_date: string,
    end_date: string,
    day_portion?: DayPortion,
    leave_type?: LeaveType,
  ): Promise<SubmittableRange> {
    return this.dayCount.assertSubmittableRange(
      employee_id,
      start_date,
      end_date,
      day_portion,
      leave_type,
    );
  }

  /** Cancel a still-pending request. Allowed for the requester or a `LEAVE:Delete` holder. */
  async cancel(id: number, caller: User): Promise<LeaveRequest> {
    const row = await this.findById(id);
    if (!isPending(row.status)) {
      throw new ConflictException({
        status: 409,
        errors: { status: `Cannot cancel a request in state ${row.status}.` },
      });
    }
    const isOwner = caller.id === row.employee_id;
    const isHr = caller.system_admin === true || hasPermission(caller, 'LEAVE:Delete');
    if (!isOwner && !isHr) {
      throw new ForbiddenException('You are not allowed to cancel this leave request');
    }
    return this.repository.update(id, {
      status: LEAVE_REQUEST_STATUSES.cancelled,
      cancelled_at: new Date(),
      cancelled_by: caller.id,
      updated_by: caller.id,
    });
  }

  /** HR pending-only edit (Q3). Route is gated by `LEAVE:Update`. */
  async update(id: number, patch: UpdateLeaveInput, caller: User): Promise<LeaveRequest> {
    const row = await this.findById(id);
    if (!isPending(row.status)) {
      throw new ConflictException({
        status: 409,
        errors: {
          status: `Cannot edit a request in state ${row.status}. Use cancel + resubmit.`,
        },
      });
    }

    // Any edit to the dates, portion, or leave type re-runs the day-count so
    // working_days + the half-day window snapshot can't go stale (and the new
    // shape is re-validated: D8 rules, single-day-for-partial, half-day type).
    const recompute =
      patch.start_date !== undefined ||
      patch.end_date !== undefined ||
      patch.day_portion !== undefined ||
      patch.leave_type !== undefined;

    if (!recompute) {
      return this.repository.update(id, { ...patch, updated_by: caller.id });
    }

    const start_date = patch.start_date ?? row.start_date;
    const end_date = patch.end_date ?? row.end_date;
    const day_portion = patch.day_portion ?? row.day_portion;
    const leave_type = patch.leave_type ?? row.leave_type;
    const { working_days, start_time, end_time } = await this.dayCount.assertSubmittableRange(
      row.employee_id,
      start_date,
      end_date,
      day_portion,
      leave_type,
    );

    return this.repository.update(id, {
      ...patch,
      day_portion,
      working_days,
      start_time,
      end_time,
      updated_by: caller.id,
    });
  }

  /**
   * Approve the current step. Advances pending_l1 → pending_l2 (when an L2
   * is snapshotted) or → approved; pending_l2 → approved. Records the
   * decision and whether it went through the chain or an override.
   */
  async approve(id: number, caller: User): Promise<LeaveRequest> {
    const row = await this.findById(id);
    if (!isPending(row.status)) {
      throw new ConflictException({
        status: 409,
        errors: { status: `Cannot approve a request in state ${row.status}.` },
      });
    }
    if (!this.canActOn(row, caller)) {
      throw new ForbiddenException({
        status: 403,
        errors: { approver: 'Not the assigned approver for this step.' },
      });
    }

    const override = isOverride(caller);
    if (!override) {
      // Normal path: the assigned step approver must still be active.
      const stepApproverId =
        row.status === LEAVE_REQUEST_STATUSES.pending_l1 ? row.l1_approver_id : row.l2_approver_id;
      if (stepApproverId != null) {
        const approver = await this.users.findById(stepApproverId);
        if (!approver || !approver.is_active) {
          throw new ConflictException({
            status: 409,
            errors: {
              approver:
                'Assigned approver is deactivated. HR must repair the chain before this advances.',
            },
          });
        }
      }
    }

    // Override (ApproveAny / system_admin) stamps the request approved
    // immediately, regardless of step (plan §8 acceptance). The normal
    // chain path advances one step at a time.
    const nextStatus: LeaveRequestStatus = override
      ? LEAVE_REQUEST_STATUSES.approved
      : row.status === LEAVE_REQUEST_STATUSES.pending_l1 && row.l2_approver_id != null
        ? LEAVE_REQUEST_STATUSES.pending_l2
        : LEAVE_REQUEST_STATUSES.approved;

    return this.repository.update(id, {
      status: nextStatus,
      decided_at: new Date(),
      decided_by: caller.id,
      decision_path: override ? DECISION_PATHS.override : DECISION_PATHS.chain,
      updated_by: caller.id,
    });
  }

  /** Reject the request from either pending state. A note is required. */
  async reject(id: number, caller: User, note: string): Promise<LeaveRequest> {
    if (!note || note.trim().length === 0) {
      throw unprocessable('decision_note', 'A rejection note is required.');
    }
    const row = await this.findById(id);
    if (!isPending(row.status)) {
      throw new ConflictException({
        status: 409,
        errors: { status: `Cannot reject a request in state ${row.status}.` },
      });
    }
    if (!this.canActOn(row, caller)) {
      throw new ForbiddenException({
        status: 403,
        errors: { approver: 'Not the assigned approver for this step.' },
      });
    }
    return this.repository.update(id, {
      status: LEAVE_REQUEST_STATUSES.rejected,
      decided_at: new Date(),
      decided_by: caller.id,
      decision_note: note,
      decision_path: isOverride(caller) ? DECISION_PATHS.override : DECISION_PATHS.chain,
      updated_by: caller.id,
    });
  }

  /** Pending items a user can act on (chain placement) — the approver inbox. */
  findInboxForApprover(approver_id: number): Promise<LeaveRequest[]> {
    return this.repository.findPendingForApprover(approver_id);
  }

  /** Every pending request — for ApproveAny / system_admin inboxes. */
  findAllPending(): Promise<LeaveRequest[]> {
    return this.repository.findAllPending();
  }

  /**
   * Full approve/reject authorization (plan §2.1 + §3.3). The approve and
   * reject routes are JWT-only at the guard because the
   * `PermissionsGuard` can't express "LEAVE:Approve OR LEAVE:ApproveAny"
   * (HR holds ApproveAny but NOT Approve — ADR 0001 keeps HR off chains).
   * So both checks live here:
   *   - role capability: `LEAVE:Approve` (chain path) or `LEAVE:ApproveAny`
   *   - chain placement: caller is the current-step approver
   * `system_admin` and `ApproveAny` bypass the chain entirely.
   */
  canActOn(request: LeaveRequest, caller: User): boolean {
    if (caller.system_admin === true) return true;
    if (hasPermission(caller, 'LEAVE:ApproveAny')) return true;
    // Chain path additionally requires the Approve capability, so a user
    // who happens to be snapshotted as an approver but lacks the role
    // can't act (defense in depth — assignment alone is not authority).
    if (!hasPermission(caller, 'LEAVE:Approve')) return false;
    if (
      request.status === LEAVE_REQUEST_STATUSES.pending_l1 &&
      request.l1_approver_id !== null &&
      caller.id === request.l1_approver_id
    ) {
      return true;
    }
    if (
      request.status === LEAVE_REQUEST_STATUSES.pending_l2 &&
      request.l2_approver_id !== null &&
      caller.id === request.l2_approver_id
    ) {
      return true;
    }
    return false;
  }
}

function isPending(status: LeaveRequestStatus): boolean {
  return (
    status === LEAVE_REQUEST_STATUSES.pending_l1 || status === LEAVE_REQUEST_STATUSES.pending_l2
  );
}

function isOverride(caller: User): boolean {
  return caller.system_admin === true || hasPermission(caller, 'LEAVE:ApproveAny');
}

function hasPermission(user: User, code: string): boolean {
  return (user.role?.permissions ?? []).some((p) => p.code === code);
}

function unprocessable(field: string, message: string): UnprocessableEntityException {
  return new UnprocessableEntityException({ status: 422, errors: { [field]: message } });
}
