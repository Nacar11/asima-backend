import { ForbiddenException, Injectable } from '@nestjs/common';
import { utcDateString } from '@/utils/helpers/dates';
import { conflict, forbidden, notFound, unprocessable } from '@/utils/helpers/http-errors';
import { hasPermission } from '@/users/domain/user-permissions';
import { BaseTimeCorrectionRequestRepository } from '@/time-correction-requests/persistence/base-time-correction-request.repository';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { ApprovalChainsService } from '@/approval-chains/approval-chains.service';
import { TimeEntriesService } from '@/time-entries/time-entries.service';
import { TimeCorrectionRequestRecord } from '@/time-correction-requests/domain/time-correction-request';
import { TimeCorrectionRequest } from '@/time-correction-requests/domain/time-correction-request.aggregate';
import { CorrectionActor } from '@/time-correction-requests/domain/correction-actor';
import {
  CorrectionStatusError,
  InvalidProposedWindowError,
  NewLogContractError,
  NotAllowedToCancelError,
  NotCurrentApproverError,
  RejectionNoteRequiredError,
} from '@/time-correction-requests/domain/time-correction-request-errors';
import { TimeCorrectionSubmitted } from '@/time-correction-requests/domain/events/time-correction-request-events';
import { DomainEventPublisher } from '@/utils/domain/domain-event-publisher';
import { TimeCorrectionRequestSearchCriteria } from '@/time-correction-requests/domain/time-correction-request-search-criteria';
import { FindAllTimeCorrectionRequest } from '@/time-correction-requests/domain/find-all-time-correction-request';
import {
  SubmitCorrectionInput,
  UpdateCorrectionInput,
} from '@/time-correction-requests/domain/time-correction-request-inputs';
import { User } from '@/users/domain/user';
import {
  TIME_CORRECTION_STATUSES,
  TimeCorrectionStatus,
} from '@/time-correction-requests/time-correction-requests.constants';

/**
 * Time-correction request use-case service — orchestrates the request
 * lifecycle: loads the `TimeCorrectionRequest` aggregate, calls its behavior
 * (the 2-step approval state machine lives on the aggregate, plan §5),
 * persists the result, and publishes the buffered events. On the final
 * approval it also applies the correction to the timesheet via
 * `TimeEntriesService.applyCorrection` (decision #7 — the time-entries module
 * owns its table; this module owns the request lifecycle). Authorization is
 * the same two-axis model as leave (role capability + chain placement; ADR
 * 0001), fed to the aggregate as a `CorrectionActor`.
 */
@Injectable()
export class TimeCorrectionRequestsService {
  constructor(
    private readonly repository: BaseTimeCorrectionRequestRepository,
    private readonly chains: ApprovalChainsService,
    private readonly users: BaseUserRepository,
    private readonly timeEntries: TimeEntriesService,
    private readonly publisher: DomainEventPublisher,
  ) {}

  findAll(criteria: TimeCorrectionRequestSearchCriteria): Promise<FindAllTimeCorrectionRequest> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<TimeCorrectionRequestRecord> {
    const row = await this.repository.findById(id);
    if (!row) throw notFound('TimeCorrectionRequest', id);
    return row;
  }

  async findByIdForViewer(id: number, caller: User): Promise<TimeCorrectionRequestRecord> {
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
   * Submit a correction for `input.employee_id`. The check order is preserved
   * exactly from the pre-DDD service (decision #5 ⚠): the pure window guard
   * first, then the chain snapshot, then ownership/dedup I/O, then the pure
   * new-log contract, then the `hasEntryOnDate` I/O — so the 422 that fires for
   * a multi-violation input is unchanged.
   */
  async submit(input: SubmitCorrectionInput, actor: User): Promise<TimeCorrectionRequestRecord> {
    // (1) Pure window invariant — strictly-after, for both targeted + new logs.
    try {
      TimeCorrectionRequest.assertProposedWindow(input.proposed_time_in, input.proposed_time_out);
    } catch (err) {
      rethrowCorrectionDomainError(err);
    }

    // (2) Snapshot the active chain; hard-block when no L1 is assigned.
    const chain = await this.chains.getActive(input.employee_id);
    if (chain.l1_approver_id == null) {
      throw unprocessable('approval_chain', 'No approver assigned. Contact HR.');
    }

    // (3) Ownership + dedup I/O (the aggregate can't reach the repo / entries).
    if (input.target_entry_id != null) {
      // Ownership guard (C1): the target must be the submitter's own entry.
      // `findById` throws NotFoundException when the entry doesn't exist.
      const target = await this.timeEntries.findById(input.target_entry_id);
      if (target.employee_id !== input.employee_id) {
        throw new ForbiddenException('You can only correct your own time entries.');
      }
      // Per-entry uniqueness: one active correction per entry.
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

    // (4) Pure new-log contract (no-op for a targeted correction): a new log
    // requires a time_out and cannot be in the future.
    try {
      TimeCorrectionRequest.assertNewLogContract({
        target_entry_id: input.target_entry_id ?? null,
        proposed_time_out: input.proposed_time_out ?? null,
        work_date: input.work_date,
        today: utcDateString(),
      });
    } catch (err) {
      rethrowCorrectionDomainError(err);
    }

    // (5) New-log only: a time entry must not already exist for the date.
    if (
      input.target_entry_id == null &&
      (await this.timeEntries.hasEntryOnDate(input.employee_id, input.work_date))
    ) {
      throw unprocessable(
        'work_date',
        `A time entry already exists for ${input.work_date}. Use Request correction instead.`,
      );
    }

    const created = await this.repository.create({
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

    // Publish the creation event post-commit, with the insert-generated id.
    this.publisher.publish([
      new TimeCorrectionSubmitted(created.id, created.employee_id, created.l1_approver_id),
    ]);
    return created;
  }

  async cancel(id: number, caller: User): Promise<TimeCorrectionRequestRecord> {
    const aggregate = await this.repository.findAggregateById(id);
    if (!aggregate) throw notFound('TimeCorrectionRequest', id);
    try {
      aggregate.cancel(toCorrectionActor(caller));
    } catch (err) {
      rethrowCorrectionDomainError(err);
    }
    const saved = await this.repository.update(id, {
      status: aggregate.status,
      cancelled_at: aggregate.cancelled_at,
      cancelled_by: aggregate.cancelled_by,
      updated_by: caller.id,
    });
    this.publisher.publish(aggregate.pullEvents());
    return saved;
  }

  /** HR pending-only edit (mirrors leave Q3). Route gated by TIME_CORRECTION:Update. */
  async update(
    id: number,
    patch: UpdateCorrectionInput,
    caller: User,
  ): Promise<TimeCorrectionRequestRecord> {
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
    // Revalidate the (possibly merged) window through the aggregate's static
    // guard so the strictly-after rule + its 422 message stay identical to submit.
    try {
      TimeCorrectionRequest.assertProposedWindow(time_in, time_out);
    } catch (err) {
      rethrowCorrectionDomainError(err);
    }
    return this.repository.update(id, { ...patch, updated_by: caller.id });
  }

  /**
   * Approve the current step. On the final approval the timesheet is mutated
   * FIRST (`applyCorrection`), then the request flips to approved — so an
   * approved request always has its time_entries row (decision #7). If the
   * timesheet write throws, we bail before persist/publish → the request stays
   * pending, identical to the pre-DDD behavior.
   */
  async approve(id: number, caller: User): Promise<TimeCorrectionRequestRecord> {
    const aggregate = await this.repository.findAggregateById(id);
    if (!aggregate) throw notFound('TimeCorrectionRequest', id);
    const actor = toCorrectionActor(caller);
    try {
      // Pure preconditions (pending + caller is the current approver).
      aggregate.assertApprovable(actor);
    } catch (err) {
      rethrowCorrectionDomainError(err);
    }

    // I/O check the aggregate can't make: the snapshotted step approver must
    // still be active on the chain path (overrides skip it).
    const override = actor.is_system_admin || actor.can_approve_any;
    if (!override) {
      const stepApproverId = aggregate.currentStepApproverId();
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

    aggregate.applyApproval(actor);

    if (aggregate.status === TIME_CORRECTION_STATUSES.approved) {
      await this.timeEntries.applyCorrection({
        employee_id: aggregate.employee_id,
        target_entry_id: aggregate.target_entry_id,
        work_date: aggregate.work_date,
        proposed_time_in: aggregate.proposed_time_in,
        proposed_time_out: aggregate.proposed_time_out,
        decided_by: caller.id,
      });
    }

    const saved = await this.repository.update(id, {
      status: aggregate.status,
      decided_at: aggregate.decided_at,
      decided_by: aggregate.decided_by,
      decision_path: aggregate.decision_path,
      updated_by: caller.id,
    });
    this.publisher.publish(aggregate.pullEvents());
    return saved;
  }

  async reject(id: number, caller: User, note: string): Promise<TimeCorrectionRequestRecord> {
    const aggregate = await this.repository.findAggregateById(id);
    if (!aggregate) throw notFound('TimeCorrectionRequest', id);
    try {
      aggregate.reject(toCorrectionActor(caller), note);
    } catch (err) {
      rethrowCorrectionDomainError(err);
    }
    const saved = await this.repository.update(id, {
      status: aggregate.status,
      decided_at: aggregate.decided_at,
      decided_by: aggregate.decided_by,
      decision_note: aggregate.decision_note,
      decision_path: aggregate.decision_path,
      updated_by: caller.id,
    });
    this.publisher.publish(aggregate.pullEvents());
    return saved;
  }

  findInboxForApprover(approver_id: number): Promise<TimeCorrectionRequestRecord[]> {
    return this.repository.findPendingForApprover(approver_id);
  }

  findAllPending(): Promise<TimeCorrectionRequestRecord[]> {
    return this.repository.findAllPending();
  }
}

function isPending(status: TimeCorrectionStatus): boolean {
  return (
    status === TIME_CORRECTION_STATUSES.pending_l1 || status === TIME_CORRECTION_STATUSES.pending_l2
  );
}

/**
 * Distil a `User` into the correction-specific capabilities the aggregate
 * needs, so the domain never imports `User` or the permission helper. `can_*`
 * map to the permission codes; `is_system_admin` is the unconditional bypass.
 */
function toCorrectionActor(caller: User): CorrectionActor {
  return {
    user_id: caller.id,
    is_system_admin: caller.system_admin === true,
    can_approve: hasPermission(caller, 'TIME_CORRECTION:Approve'),
    can_approve_any: hasPermission(caller, 'TIME_CORRECTION:ApproveAny'),
    can_delete: hasPermission(caller, 'TIME_CORRECTION:Delete'),
  };
}

/**
 * Translate a pure domain error from the `TimeCorrectionRequest` aggregate /
 * value objects into the exact HTTP exception the service threw before the DDD
 * migration (decision #8), so the wire contract is unchanged. Anything else is
 * rethrown untouched.
 */
function rethrowCorrectionDomainError(err: unknown): never {
  if (err instanceof CorrectionStatusError) throw conflict('status', err.message);
  if (err instanceof NotCurrentApproverError) throw forbidden('approver', err.message);
  if (err instanceof RejectionNoteRequiredError) throw unprocessable('decision_note', err.message);
  if (err instanceof NotAllowedToCancelError) throw new ForbiddenException(err.message);
  if (err instanceof InvalidProposedWindowError)
    throw unprocessable('proposed_time_out', err.message);
  if (err instanceof NewLogContractError) throw unprocessable(err.field, err.message);
  throw err;
}
