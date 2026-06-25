import { AggregateRoot } from '@/utils/domain/aggregate-root';
import { AuditStamp } from '@/utils/domain/audit-stamp';
import { DateRange } from '@/utils/domain/value-objects/date-range';
import { LeaveStatus } from '@/leave-requests/domain/value-objects/leave-status';
import { LeaveDuration } from '@/leave-requests/domain/value-objects/leave-duration';
import { HalfDayWindow } from '@/leave-requests/domain/value-objects/half-day-window';
import { LeaveRequestRecord } from '@/leave-requests/domain/leave-request';
import { LeaveActor } from '@/leave-requests/domain/leave-actor';
import {
  AttachmentContractError,
  LeaveStatusError,
  NotAllowedToCancelError,
  NotCurrentApproverError,
  RejectionNoteRequiredError,
} from '@/leave-requests/domain/leave-request-errors';
import {
  LeaveRequestAdvancedToL2,
  LeaveRequestApproved,
  LeaveRequestCancelled,
  LeaveRequestRejected,
} from '@/leave-requests/domain/events/leave-request-events';
import {
  ATTACHMENT_REQUIRED_LEAVE_TYPES,
  DAY_PORTIONS,
  DayPortion,
  DECISION_PATHS,
  DecisionPath,
  LEAVE_REQUEST_STATUSES,
  LeaveRequestStatus,
  LeaveType,
} from '@/leave-requests/leave-requests.constants';

/**
 * The full persisted shape of a leave request — the reconstitution input.
 * It IS the persisted data record, so alias it rather than duplicate the
 * field list (the two must never drift).
 */
export type LeaveRequestProps = LeaveRequestRecord;

/**
 * Leave-request aggregate root. Owns the 2-step approval state machine
 * (ADR 0001, plan §3.2): the lifecycle rules that used to live in
 * `LeaveRequestsService` are here, as behavior on the aggregate. The
 * use-case loads the aggregate, calls a behavior method, persists the
 * result, then publishes the buffered events.
 *
 * Pure TS — no `@nestjs/*`, no `typeorm`. I/O-dependent checks (the
 * step-approver's active status, schedule-aware day counts) stay in the
 * use-case and are fed in.
 */
export class LeaveRequest extends AggregateRoot {
  private _status: LeaveStatus;
  private decided_at_: Date | null;
  private decided_by_: number | null;
  private decision_note_: string | null;
  private decision_path_: DecisionPath | null;
  private cancelled_at_: Date | null;
  private cancelled_by_: number | null;

  // Validated value-object view of the persisted state. Building these in the
  // constructor means a reconstituted aggregate can never hold an invalid
  // span / duration / half-day window — the rules live on the values.
  private readonly _range: DateRange;
  private readonly _duration: LeaveDuration;
  private readonly _window: HalfDayWindow;
  private readonly _audit: AuditStamp;

  private constructor(private readonly p: LeaveRequestProps) {
    super();
    this._status = new LeaveStatus(p.status);
    this.decided_at_ = p.decided_at;
    this.decided_by_ = p.decided_by;
    this.decision_note_ = p.decision_note;
    this.decision_path_ = p.decision_path;
    this.cancelled_at_ = p.cancelled_at;
    this.cancelled_by_ = p.cancelled_by;
    this._range = new DateRange(p.start_date, p.end_date);
    this._duration = new LeaveDuration(p.working_days);
    this._window = new HalfDayWindow(p.day_portion, p.start_time, p.end_time);
    this._audit = new AuditStamp({
      created_by: p.created_by,
      updated_by: p.updated_by,
      deleted_by: p.deleted_by,
      created_at: p.created_at,
      updated_at: p.updated_at,
      deleted_at: p.deleted_at,
    });
  }

  /**
   * Rebuild the aggregate from persisted state. The constructor builds the
   * value objects, which **validate** — so a corrupt row (e.g. a half-day
   * window with start ≥ end, or end_date < start_date) throws here on load
   * rather than producing a silently-invalid aggregate. Persisted rows are
   * written valid, so this is fail-fast on data corruption, not a hot path.
   */
  static reconstitute(props: LeaveRequestProps): LeaveRequest {
    return new LeaveRequest(props);
  }

  // ── read accessors ───────────────────────────────────────────
  get id(): number {
    return this.p.id;
  }
  get employee_id(): number {
    return this.p.employee_id;
  }
  get status(): LeaveRequestStatus {
    return this._status.value;
  }
  get start_date(): string {
    return this._range.start;
  }
  get end_date(): string {
    return this._range.end;
  }

  /** Validated value-object views of the request's state. */
  get range(): DateRange {
    return this._range;
  }
  get duration(): LeaveDuration {
    return this._duration;
  }
  get halfDayWindow(): HalfDayWindow {
    return this._window;
  }
  get audit(): AuditStamp {
    return this._audit;
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
  get decision_path(): DecisionPath | null {
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
    if (this._status.value === LEAVE_REQUEST_STATUSES.pending_l1) return this.p.l1_approver_id;
    if (this._status.value === LEAVE_REQUEST_STATUSES.pending_l2) return this.p.l2_approver_id;
    return null;
  }

  /**
   * Whether `actor` may approve/reject this request right now: the chain
   * placement OR an override (ApproveAny / system_admin). Mirrors the old
   * `LeaveRequestsService.canActOn` exactly (ADR 0001).
   */
  isActionableBy(actor: LeaveActor): boolean {
    if (actor.is_system_admin) return true;
    if (actor.can_approve_any) return true;
    if (!actor.can_approve) return false;
    if (this._status.value === LEAVE_REQUEST_STATUSES.pending_l1) {
      return actor.user_id === this.p.l1_approver_id;
    }
    if (this._status.value === LEAVE_REQUEST_STATUSES.pending_l2) {
      return actor.user_id === this.p.l2_approver_id;
    }
    return false;
  }

  private isOverride(actor: LeaveActor): boolean {
    return actor.is_system_admin || actor.can_approve_any;
  }

  /**
   * The state an approval moves to: an override jumps straight to `approved`;
   * the chain path advances `pending_l1 → pending_l2` only when an L2 is
   * snapshotted, otherwise straight to `approved` (and `pending_l2 → approved`).
   */
  private nextStatusAfterApproval(override: boolean): LeaveRequestStatus {
    if (override) return LEAVE_REQUEST_STATUSES.approved;
    const advancesToL2 =
      this._status.value === LEAVE_REQUEST_STATUSES.pending_l1 && this.p.l2_approver_id != null;
    return advancesToL2 ? LEAVE_REQUEST_STATUSES.pending_l2 : LEAVE_REQUEST_STATUSES.approved;
  }

  private assertPending(action: 'approve' | 'reject'): void {
    if (!this._status.isPending()) {
      throw new LeaveStatusError(`Cannot ${action} a request in state ${this._status.value}.`);
    }
  }

  private assertCurrentApprover(actor: LeaveActor): void {
    if (!this.isActionableBy(actor)) {
      throw new NotCurrentApproverError('Not the assigned approver for this step.');
    }
  }

  /**
   * Pure precondition for approval: must be pending and the caller must be
   * the current-step approver (or an override). Throws on failure. The
   * use-case runs this, then performs the I/O "is the step approver still
   * active?" check, then calls `applyApproval` — preserving the original
   * error ordering without the aggregate touching the DB.
   */
  assertApprovable(actor: LeaveActor): void {
    this.assertPending('approve');
    this.assertCurrentApprover(actor);
  }

  /**
   * Apply an approval. Override holders jump straight to `approved`; the
   * chain path advances one step (pending_l1 → pending_l2 when an L2 is
   * snapshotted, else → approved; pending_l2 → approved). Stamps the
   * decision on every call, matching the prior service behavior.
   */
  applyApproval(actor: LeaveActor): void {
    const override = this.isOverride(actor);
    const next = this.nextStatusAfterApproval(override);

    this._status = new LeaveStatus(next);
    this.decided_at_ = new Date();
    this.decided_by_ = actor.user_id;
    this.decision_path_ = override ? DECISION_PATHS.override : DECISION_PATHS.chain;

    if (next === LEAVE_REQUEST_STATUSES.pending_l2) {
      this.recordEvent(
        new LeaveRequestAdvancedToL2(
          this.p.id,
          this.p.employee_id,
          this.p.l2_approver_id as number,
        ),
      );
    } else {
      this.recordEvent(
        new LeaveRequestApproved(this.p.id, this.p.employee_id, actor.user_id, this.decision_path_),
      );
    }
  }

  /** Reject from a pending state. A non-empty note is required. */
  reject(actor: LeaveActor, note: string): void {
    if (!note || note.trim().length === 0) {
      throw new RejectionNoteRequiredError('A rejection note is required.');
    }
    this.assertPending('reject');
    this.assertCurrentApprover(actor);

    this._status = new LeaveStatus(LEAVE_REQUEST_STATUSES.rejected);
    this.decided_at_ = new Date();
    this.decided_by_ = actor.user_id;
    this.decision_note_ = note;
    this.decision_path_ = this.isOverride(actor) ? DECISION_PATHS.override : DECISION_PATHS.chain;

    this.recordEvent(new LeaveRequestRejected(this.p.id, this.p.employee_id, actor.user_id));
  }

  /**
   * Cancel an active request. Only the owner or an HR holder (`can_delete`
   * / system_admin) may cancel, and not after the leave window has elapsed.
   * `today` (YYYY-MM-DD) is supplied by the use-case for determinism.
   */
  cancel(actor: LeaveActor, today: string): void {
    if (!this._status.isActive()) {
      throw new LeaveStatusError(`Cannot cancel a request in state ${this._status.value}.`);
    }
    if (this._range.endsBefore(today)) {
      throw new LeaveStatusError('Cannot cancel a leave that has already ended.');
    }
    const isOwner = actor.user_id === this.p.employee_id;
    const isHr = actor.is_system_admin || actor.can_delete;
    if (!isOwner && !isHr) {
      throw new NotAllowedToCancelError('You are not allowed to cancel this leave request');
    }

    this._status = new LeaveStatus(LEAVE_REQUEST_STATUSES.cancelled);
    this.cancelled_at_ = new Date();
    this.cancelled_by_ = actor.user_id;

    this.recordEvent(new LeaveRequestCancelled(this.p.id, this.p.employee_id, actor.user_id));
  }

  /** Default a missing portion to `full`. */
  static normalizePortion(portion?: DayPortion): DayPortion {
    return portion ?? DAY_PORTIONS.full;
  }

  /**
   * The submit-time attachment invariant (a pure rule): `sick` / `bereavement`
   * require exactly one supporting file; every other type must omit one. The
   * use-case calls this early (before the schedule/chain I/O) so the error
   * ordering matches the original service.
   */
  static assertAttachmentContract(leave_type: LeaveType, hasAttachment: boolean): void {
    const requiresAttachment = ATTACHMENT_REQUIRED_LEAVE_TYPES.has(leave_type);
    if (requiresAttachment && !hasAttachment) {
      throw new AttachmentContractError(`${leave_type} leave requires one attachment.`);
    }
    if (!requiresAttachment && hasAttachment) {
      throw new AttachmentContractError(`${leave_type} leave does not accept an attachment.`);
    }
  }
}
