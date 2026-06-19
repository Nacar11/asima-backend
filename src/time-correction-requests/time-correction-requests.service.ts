import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { utcDateString } from '@/utils/helpers/dates';
import { conflict, forbidden, unprocessable } from '@/utils/helpers/http-errors';
import { hasPermission } from '@/users/domain/user-permissions';
import { BaseTimeCorrectionRequestRepository } from '@/time-correction-requests/persistence/base-time-correction-request.repository';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { ApprovalChainsService } from '@/approval-chains/approval-chains.service';
import { TimeEntriesService } from '@/time-entries/time-entries.service';
import { TimeCorrectionRequest } from '@/time-correction-requests/domain/time-correction-request';
import { TimeCorrectionRequestSearchCriteria } from '@/time-correction-requests/domain/time-correction-request-search-criteria';
import { FindAllTimeCorrectionRequest } from '@/time-correction-requests/domain/find-all-time-correction-request';
import {
  SubmitCorrectionInput,
  UpdateCorrectionInput,
} from '@/time-correction-requests/domain/time-correction-request-inputs';
import { User } from '@/users/domain/user';
import {
  TC_DECISION_PATHS,
  TIME_CORRECTION_STATUSES,
  TimeCorrectionStatus,
} from '@/time-correction-requests/time-correction-requests.constants';

/**
 * Time-correction request service — mirrors the leave lifecycle (plan §10)
 * with one extra responsibility: on final approval it applies the
 * correction to the timesheet via `TimeEntriesService.applyCorrection`
 * (Q6 — the time-entries module owns its table write; this module owns
 * the request lifecycle). Authorization is the same two-axis model as
 * leave (role capability + chain placement; ADR 0001).
 */
@Injectable()
export class TimeCorrectionRequestsService {
  constructor(
    private readonly repository: BaseTimeCorrectionRequestRepository,
    private readonly chains: ApprovalChainsService,
    private readonly users: BaseUserRepository,
    private readonly timeEntries: TimeEntriesService,
  ) {}

  findAll(criteria: TimeCorrectionRequestSearchCriteria): Promise<FindAllTimeCorrectionRequest> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<TimeCorrectionRequest> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`TimeCorrectionRequest with id ${id} not found`);
    return row;
  }

  async findByIdForViewer(id: number, caller: User): Promise<TimeCorrectionRequest> {
    const row = await this.findById(id);
    const allowed =
      caller.id === row.employee_id ||
      caller.id === row.l1_approver_id ||
      caller.id === row.l2_approver_id ||
      caller.system_admin === true ||
      hasPermission(caller, 'TIME_CORRECTION:ViewAll');
    if (!allowed) {
      throw new ForbiddenException('You are not allowed to view this correction request');
    }
    return row;
  }

  /**
   * Submit a correction for `input.employee_id`. Snapshots the active
   * chain; hard-blocks when no L1 is assigned and when a pending/approved
   * correction already exists for the same (employee, work_date) (plan §10).
   */
  async submit(input: SubmitCorrectionInput, actor: User): Promise<TimeCorrectionRequest> {
    if (input.proposed_time_out && input.proposed_time_out <= input.proposed_time_in) {
      throw unprocessable(
        'proposed_time_out',
        'proposed_time_out must be strictly after proposed_time_in.',
      );
    }

    const chain = await this.chains.getActive(input.employee_id);
    if (chain.l1_approver_id == null) {
      throw unprocessable('approval_chain', 'No approver assigned. Contact HR.');
    }

    if (input.target_entry_id != null) {
      // Ownership guard (C1): the target must be the submitter's own entry.
      // `submit` previously trusted the client-supplied id — an IDOR that let an
      // employee target (and read back the times of) another employee's entry.
      // `findById` throws NotFoundException when the entry doesn't exist.
      const target = await this.timeEntries.findById(input.target_entry_id);
      if (target.employee_id !== input.employee_id) {
        throw new ForbiddenException('You can only correct your own time entries.');
      }
      // Per-entry uniqueness: one active correction per entry, so a regular
      // shift and an OT entry on the same day are corrected independently.
      const existing = await this.repository.findActiveForEntry(input.target_entry_id);
      if (existing.length > 0) {
        throw unprocessable(
          'target_entry_id',
          `A correction request already exists for this entry (#${existing[0].id}).`,
        );
      }
    } else {
      // New-log (missed punch): at most one active new-log per date.
      const sameDate = await this.repository.findActiveForEmployeeDate(
        input.employee_id,
        input.work_date,
      );
      const activeNewLog = sameDate.filter((r) => r.target_entry_id == null);
      if (activeNewLog.length > 0) {
        throw unprocessable(
          'work_date',
          `A new-log request already exists for ${input.work_date} (#${activeNewLog[0].id}).`,
        );
      }
    }

    // Manual add ("Add Logs"): no existing row to correct. These rules apply
    // ONLY to the null-target path — a correction that targets an existing
    // entry keeps its looser contract (out optional, date from the entry).
    if (input.target_entry_id == null) {
      if (!input.proposed_time_out) {
        throw unprocessable('proposed_time_out', 'Time out is required when adding a log.');
      }
      const today = utcDateString();
      if (input.work_date > today) {
        throw unprocessable('work_date', 'Cannot add a log for a future date.');
      }
      if (await this.timeEntries.hasEntryOnDate(input.employee_id, input.work_date)) {
        throw unprocessable(
          'work_date',
          `A time entry already exists for ${input.work_date}. Use Request correction instead.`,
        );
      }
    }

    return this.repository.create({
      employee_id: input.employee_id,
      target_entry_id: input.target_entry_id ?? null,
      work_date: input.work_date,
      proposed_time_in: input.proposed_time_in,
      proposed_time_out: input.proposed_time_out ?? null,
      reason: input.reason,
      status: TIME_CORRECTION_STATUSES.pending_l1,
      l1_approver_id: chain.l1_approver_id,
      l2_approver_id: chain.l2_approver_id,
      created_by: actor.id,
    });
  }

  async cancel(id: number, caller: User): Promise<TimeCorrectionRequest> {
    const row = await this.findById(id);
    if (!isPending(row.status)) {
      throw conflict('status', `Cannot cancel a request in state ${row.status}.`);
    }
    const isOwner = caller.id === row.employee_id;
    const isHr = caller.system_admin === true || hasPermission(caller, 'TIME_CORRECTION:Delete');
    if (!isOwner && !isHr) {
      throw new ForbiddenException('You are not allowed to cancel this correction request');
    }
    return this.repository.update(id, {
      status: TIME_CORRECTION_STATUSES.cancelled,
      cancelled_at: new Date(),
      cancelled_by: caller.id,
      updated_by: caller.id,
    });
  }

  /** HR pending-only edit (mirrors leave Q3). Route gated by TIME_CORRECTION:Update. */
  async update(
    id: number,
    patch: UpdateCorrectionInput,
    caller: User,
  ): Promise<TimeCorrectionRequest> {
    const row = await this.findById(id);
    if (!isPending(row.status)) {
      throw conflict(
        'status',
        `Cannot edit a request in state ${row.status}. Use cancel + resubmit.`,
      );
    }
    const time_in = patch.proposed_time_in ?? row.proposed_time_in;
    const time_out =
      patch.proposed_time_out !== undefined ? patch.proposed_time_out : row.proposed_time_out;
    if (time_out && time_out <= time_in) {
      throw unprocessable(
        'proposed_time_out',
        'proposed_time_out must be strictly after proposed_time_in.',
      );
    }
    return this.repository.update(id, { ...patch, updated_by: caller.id });
  }

  /**
   * Approve the current step. On the final approval the timesheet is
   * mutated FIRST (applyCorrection), then the request flips to approved —
   * so an approved request always has its time_entries row written. (A
   * shared cross-module DB transaction is a follow-up; see plan Q6.)
   */
  async approve(id: number, caller: User): Promise<TimeCorrectionRequest> {
    const row = await this.findById(id);
    if (!isPending(row.status)) {
      throw conflict('status', `Cannot approve a request in state ${row.status}.`);
    }
    if (!this.canActOn(row, caller)) {
      throw forbidden('approver', 'Not the assigned approver for this step.');
    }

    const override = isOverride(caller);
    if (!override) {
      const stepApproverId =
        row.status === TIME_CORRECTION_STATUSES.pending_l1
          ? row.l1_approver_id
          : row.l2_approver_id;
      if (stepApproverId != null) {
        const approver = await this.users.findById(stepApproverId);
        if (!approver || !approver.is_active) {
          throw conflict(
            'approver',
            'Assigned approver is deactivated. HR must repair the chain before this advances.',
          );
        }
      }
    }

    const nextStatus: TimeCorrectionStatus = override
      ? TIME_CORRECTION_STATUSES.approved
      : row.status === TIME_CORRECTION_STATUSES.pending_l1 && row.l2_approver_id != null
        ? TIME_CORRECTION_STATUSES.pending_l2
        : TIME_CORRECTION_STATUSES.approved;

    if (nextStatus === TIME_CORRECTION_STATUSES.approved) {
      await this.timeEntries.applyCorrection({
        employee_id: row.employee_id,
        target_entry_id: row.target_entry_id,
        work_date: row.work_date,
        proposed_time_in: row.proposed_time_in,
        proposed_time_out: row.proposed_time_out,
        decided_by: caller.id,
      });
    }

    return this.repository.update(id, {
      status: nextStatus,
      decided_at: new Date(),
      decided_by: caller.id,
      decision_path: override ? TC_DECISION_PATHS.override : TC_DECISION_PATHS.chain,
      updated_by: caller.id,
    });
  }

  async reject(id: number, caller: User, note: string): Promise<TimeCorrectionRequest> {
    if (!note || note.trim().length === 0) {
      throw unprocessable('decision_note', 'A rejection note is required.');
    }
    const row = await this.findById(id);
    if (!isPending(row.status)) {
      throw conflict('status', `Cannot reject a request in state ${row.status}.`);
    }
    if (!this.canActOn(row, caller)) {
      throw forbidden('approver', 'Not the assigned approver for this step.');
    }
    return this.repository.update(id, {
      status: TIME_CORRECTION_STATUSES.rejected,
      decided_at: new Date(),
      decided_by: caller.id,
      decision_note: note,
      decision_path: isOverride(caller) ? TC_DECISION_PATHS.override : TC_DECISION_PATHS.chain,
      updated_by: caller.id,
    });
  }

  findInboxForApprover(approver_id: number): Promise<TimeCorrectionRequest[]> {
    return this.repository.findPendingForApprover(approver_id);
  }

  findAllPending(): Promise<TimeCorrectionRequest[]> {
    return this.repository.findAllPending();
  }

  /** Full approve/reject authorization (same model as leave; see ADR 0001). */
  canActOn(request: TimeCorrectionRequest, caller: User): boolean {
    if (caller.system_admin === true) return true;
    if (hasPermission(caller, 'TIME_CORRECTION:ApproveAny')) return true;
    if (!hasPermission(caller, 'TIME_CORRECTION:Approve')) return false;
    // Chain match: caller is the snapshotted approver for the current step.
    // (`caller.id` is a number, so an equality check already excludes a null
    // approver id — no separate null guard needed.)
    if (request.status === TIME_CORRECTION_STATUSES.pending_l1) {
      return caller.id === request.l1_approver_id;
    }
    if (request.status === TIME_CORRECTION_STATUSES.pending_l2) {
      return caller.id === request.l2_approver_id;
    }
    return false;
  }
}

function isPending(status: TimeCorrectionStatus): boolean {
  return (
    status === TIME_CORRECTION_STATUSES.pending_l1 || status === TIME_CORRECTION_STATUSES.pending_l2
  );
}

function isOverride(caller: User): boolean {
  return caller.system_admin === true || hasPermission(caller, 'TIME_CORRECTION:ApproveAny');
}
