import { AggregateRoot } from '@/utils/domain/aggregate-root';
import { CorrectionStatus } from '@/time-correction-requests/domain/value-objects/correction-status';
import { ProposedPunch } from '@/time-correction-requests/domain/value-objects/proposed-punch';
import { TimeCorrectionRequestRecord } from '@/time-correction-requests/domain/time-correction-request';
import { CorrectionActor } from '@/time-correction-requests/domain/correction-actor';
import {
  CorrectionStatusError,
  NewLogContractError,
  NotAllowedToCancelError,
  NotCurrentApproverError,
  RejectionNoteRequiredError,
} from '@/time-correction-requests/domain/time-correction-request-errors';
import {
  TimeCorrectionAdvancedToL2,
  TimeCorrectionApproved,
  TimeCorrectionCancelled,
  TimeCorrectionRejected,
} from '@/time-correction-requests/domain/events/time-correction-request-events';
import {
  TC_DECISION_PATHS,
  TcDecisionPath,
  TIME_CORRECTION_STATUSES,
  TimeCorrectionStatus,
} from '@/time-correction-requests/time-correction-requests.constants';

/**
 * The full persisted shape of a time-correction request — the reconstitution
 * input. It IS the persisted record, so alias it rather than duplicate the
 * field list (the two must never drift).
 */
export type TimeCorrectionRequestProps = TimeCorrectionRequestRecord;

/** The pure new-log contract inputs, fed in by the use-case at submit time. */
export type NewLogContractInput = {
  target_entry_id: number | null;
  proposed_time_out: Date | null;
  work_date: string;
  today: string;
};

/**
 * Time-correction request aggregate root. Owns the 2-step approval state
 * machine (ADR 0001, plan §5): the lifecycle rules that used to live in
 * `TimeCorrectionRequestsService` are here, as behavior on the aggregate. The
 * use-case loads the aggregate, calls a behavior method, persists the result,
 * then publishes the buffered events.
 *
 * Pure TS — no `@nestjs/*`, no `typeorm`. I/O-dependent checks (the step
 * approver's active status, chain snapshot, dedup, `hasEntryOnDate`,
 * ownership) stay in the use-case and are fed in.
 */
export class TimeCorrectionRequest extends AggregateRoot {
  private _status: CorrectionStatus;
  private decided_at_: Date | null;
  private decided_by_: number | null;
  private decision_note_: string | null;
  private decision_path_: TcDecisionPath | null;
  private cancelled_at_: Date | null;
  private cancelled_by_: number | null;

  // Validated value-object view of the persisted state. Building this in the
  // constructor means a reconstituted aggregate can never hold an invalid
  // proposed window — the rule lives on the value.
  private readonly _punch: ProposedPunch;

  private constructor(private readonly p: TimeCorrectionRequestProps) {
    super();
    this._status = new CorrectionStatus(p.status);
    this.decided_at_ = p.decided_at;
    this.decided_by_ = p.decided_by;
    this.decision_note_ = p.decision_note;
    this.decision_path_ = p.decision_path;
    this.cancelled_at_ = p.cancelled_at;
    this.cancelled_by_ = p.cancelled_by;
    this._punch = new ProposedPunch(p.proposed_time_in, p.proposed_time_out);
  }

  /**
   * Rebuild the aggregate from persisted state. The constructor builds the
   * value objects, which **validate** — so a corrupt row (a window with
   * `time_out <= time_in`, or an unknown status) throws here on load rather
   * than producing a silently-invalid aggregate. Persisted rows are written
   * valid, so this is fail-fast on data corruption, not a hot path.
   */
  static reconstitute(props: TimeCorrectionRequestProps): TimeCorrectionRequest {
    return new TimeCorrectionRequest(props);
  }

  // ── read accessors ───────────────────────────────────────────
  get id(): number {
    return this.p.id;
  }
  get employee_id(): number {
    return this.p.employee_id;
  }
  get target_entry_id(): number | null {
    return this.p.target_entry_id;
  }
  get work_date(): string {
    return this.p.work_date;
  }
  get proposed_time_in(): Date {
    return this._punch.time_in;
  }
  get proposed_time_out(): Date | null {
    return this._punch.time_out;
  }
  get status(): TimeCorrectionStatus {
    return this._status.value;
  }
  get l1_approver_id(): number {
    return this.p.l1_approver_id;
  }
  get l2_approver_id(): number | null {
    return this.p.l2_approver_id;
  }
  get decided_at(): Date | null {
    return this.decided_at_;
  }
  get decided_by(): number | null {
    return this.decided_by_;
  }
  get decision_note(): string | null {
    return this.decision_note_;
  }
  get decision_path(): TcDecisionPath | null {
    return this.decision_path_;
  }
  get cancelled_at(): Date | null {
    return this.cancelled_at_;
  }
  get cancelled_by(): number | null {
    return this.cancelled_by_;
  }

  /** The approver snapshotted for the current pending step (null if none). */
  currentStepApproverId(): number | null {
    if (this._status.value === TIME_CORRECTION_STATUSES.pending_l1) return this.p.l1_approver_id;
    if (this._status.value === TIME_CORRECTION_STATUSES.pending_l2) return this.p.l2_approver_id;
    return null;
  }

  /**
   * Whether `actor` may approve/reject this request right now: the chain
   * placement OR an override (ApproveAny / system_admin). Mirrors the old
   * `TimeCorrectionRequestsService.canActOn` exactly (ADR 0001).
   */
  isActionableBy(actor: CorrectionActor): boolean {
    if (actor.is_system_admin) return true;
    if (actor.can_approve_any) return true;
    if (!actor.can_approve) return false;
    if (this._status.value === TIME_CORRECTION_STATUSES.pending_l1) {
      return actor.user_id === this.p.l1_approver_id;
    }
    if (this._status.value === TIME_CORRECTION_STATUSES.pending_l2) {
      return actor.user_id === this.p.l2_approver_id;
    }
    return false;
  }

  private isOverride(actor: CorrectionActor): boolean {
    return actor.is_system_admin || actor.can_approve_any;
  }

  /**
   * The state an approval moves to: an override jumps straight to `approved`;
   * the chain path advances `pending_l1 → pending_l2` only when an L2 is
   * snapshotted, otherwise straight to `approved` (and `pending_l2 → approved`).
   */
  private nextStatusAfterApproval(override: boolean): TimeCorrectionStatus {
    if (override) return TIME_CORRECTION_STATUSES.approved;
    const advancesToL2 =
      this._status.value === TIME_CORRECTION_STATUSES.pending_l1 && this.p.l2_approver_id != null;
    return advancesToL2 ? TIME_CORRECTION_STATUSES.pending_l2 : TIME_CORRECTION_STATUSES.approved;
  }

  private assertPending(action: 'approve' | 'reject'): void {
    if (!this._status.isPending()) {
      throw new CorrectionStatusError(`Cannot ${action} a request in state ${this._status.value}.`);
    }
  }

  private assertCurrentApprover(actor: CorrectionActor): void {
    if (!this.isActionableBy(actor)) {
      throw new NotCurrentApproverError('Not the assigned approver for this step.');
    }
  }

  /**
   * Pure precondition for approval: must be pending and the caller must be the
   * current-step approver (or an override). The use-case runs this, then
   * performs the I/O "is the step approver still active?" check, then calls
   * `applyApproval` — preserving the original error ordering.
   */
  assertApprovable(actor: CorrectionActor): void {
    this.assertPending('approve');
    this.assertCurrentApprover(actor);
  }

  /**
   * Apply an approval. Override holders jump straight to `approved`; the chain
   * path advances one step (pending_l1 → pending_l2 when an L2 is snapshotted,
   * else → approved; pending_l2 → approved). Stamps the decision on every call,
   * matching the prior service behavior. The use-case inspects `status`
   * afterwards to know whether to apply the timesheet write (decision #7).
   */
  applyApproval(actor: CorrectionActor): void {
    const override = this.isOverride(actor);
    const next = this.nextStatusAfterApproval(override);

    this._status = new CorrectionStatus(next);
    this.decided_at_ = new Date();
    this.decided_by_ = actor.user_id;
    this.decision_path_ = override ? TC_DECISION_PATHS.override : TC_DECISION_PATHS.chain;

    if (next === TIME_CORRECTION_STATUSES.pending_l2) {
      this.recordEvent(
        new TimeCorrectionAdvancedToL2(
          this.p.id,
          this.p.employee_id,
          this.p.l2_approver_id as number,
        ),
      );
    } else {
      this.recordEvent(
        new TimeCorrectionApproved(
          this.p.id,
          this.p.employee_id,
          actor.user_id,
          this.decision_path_,
        ),
      );
    }
  }

  /** Reject from a pending state. A non-empty note is required. */
  reject(actor: CorrectionActor, note: string): void {
    if (!note || note.trim().length === 0) {
      throw new RejectionNoteRequiredError('A rejection note is required.');
    }
    this.assertPending('reject');
    this.assertCurrentApprover(actor);

    this._status = new CorrectionStatus(TIME_CORRECTION_STATUSES.rejected);
    this.decided_at_ = new Date();
    this.decided_by_ = actor.user_id;
    this.decision_note_ = note;
    this.decision_path_ = this.isOverride(actor)
      ? TC_DECISION_PATHS.override
      : TC_DECISION_PATHS.chain;

    this.recordEvent(new TimeCorrectionRejected(this.p.id, this.p.employee_id, actor.user_id));
  }

  /**
   * Cancel a pending request. Unlike leave there is **no** not-elapsed date
   * rule — a correction is cancellable only while pending (an approved one is
   * already written to the timesheet). Only the owner or an HR holder
   * (`can_delete` / system_admin) may cancel.
   */
  cancel(actor: CorrectionActor): void {
    if (!this._status.isPending()) {
      throw new CorrectionStatusError(`Cannot cancel a request in state ${this._status.value}.`);
    }
    const isOwner = actor.user_id === this.p.employee_id;
    const isHr = actor.is_system_admin || actor.can_delete;
    if (!isOwner && !isHr) {
      throw new NotAllowedToCancelError('You are not allowed to cancel this correction request');
    }

    this._status = new CorrectionStatus(TIME_CORRECTION_STATUSES.cancelled);
    this.cancelled_at_ = new Date();
    this.cancelled_by_ = actor.user_id;

    this.recordEvent(new TimeCorrectionCancelled(this.p.id, this.p.employee_id, actor.user_id));
  }

  /**
   * Submit-time window invariant (a pure rule), applies to BOTH a targeted
   * correction and a new log: when a `time_out` is given it must be strictly
   * after `time_in`. Constructing the value object enforces it.
   */
  static assertProposedWindow(time_in: Date, time_out?: Date | null): void {
    new ProposedPunch(time_in, time_out ?? null);
  }

  /**
   * Submit-time new-log ("Add Logs") contract (a pure rule): only when there is
   * no target entry, a `time_out` is required and the `work_date` cannot be in
   * the future. A targeted correction keeps its looser contract (out optional,
   * date from the entry). The I/O dedup / `hasEntryOnDate` checks stay in the
   * use-case.
   */
  static assertNewLogContract(input: NewLogContractInput): void {
    if (input.target_entry_id != null) return;
    if (!input.proposed_time_out) {
      throw new NewLogContractError('proposed_time_out', 'Time out is required when adding a log.');
    }
    if (input.work_date > input.today) {
      throw new NewLogContractError('work_date', 'Cannot add a log for a future date.');
    }
  }
}
