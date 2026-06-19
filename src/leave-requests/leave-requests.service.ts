import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { conflict, forbidden, unprocessable } from '@/utils/helpers/http-errors';
import { hasPermission } from '@/users/domain/user-permissions';
import { BaseLeaveRequestRepository } from '@/leave-requests/persistence/base-leave-request.repository';
import { LeaveDayCountService, SubmittableRange } from '@/leave-requests/leave-day-count.service';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { ApprovalChainsService } from '@/approval-chains/approval-chains.service';
import { LeaveRequest } from '@/leave-requests/domain/leave-request';
import { LeaveRequestSearchCriteria } from '@/leave-requests/domain/leave-request-search-criteria';
import { FindAllLeaveRequest } from '@/leave-requests/domain/find-all-leave-request';
import { SubmitLeaveInput, UpdateLeaveInput } from '@/leave-requests/domain/leave-request-inputs';
import { Readable } from 'stream';
import { User } from '@/users/domain/user';
import { AttachmentService, UploadedFile } from '@/storage/attachment.service';
import { FILE_VERSIONS, FileVersion } from '@/storage/domain/file-version';
import {
  ATTACHMENT_REQUIRED_LEAVE_TYPES,
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
    private readonly attachments: AttachmentService,
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
   *
   * `sick` and `bereavement` require exactly one supporting `file`; every
   * other type rejects one. The storage work (validate → process → upload)
   * is delegated to `AttachmentService` and happens **before** the
   * transaction; the attachment row + leave_request commit together, and a
   * failed commit triggers a compensating object delete.
   */
  async submit(input: SubmitLeaveInput, actor: User, file?: UploadedFile): Promise<LeaveRequest> {
    // Leave-side rule (this service's concern): the attachment is part of
    // sick/bereavement's contract; any other type must not carry one.
    const requiresAttachment = ATTACHMENT_REQUIRED_LEAVE_TYPES.has(input.leave_type);
    if (requiresAttachment && !file) {
      throw unprocessable('attachment', `${input.leave_type} leave requires one attachment.`);
    }
    if (!requiresAttachment && file) {
      throw unprocessable('attachment', `${input.leave_type} leave does not accept an attachment.`);
    }

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

    // Validate the file bytes and upload every version object under a fresh
    // UUID prefix — all BEFORE the transaction opens, so no S3 network I/O
    // runs with a pooled connection pinned (plan "Why a UUID prefix").
    const prepared = file
      ? await this.attachments.uploadForOwner({
          file,
          owner_id: input.employee_id,
          actor_id: actor.id,
        })
      : null;

    try {
      // Reserve-on-submit (plan C3): inside one transaction, lock this
      // (employee, type)'s allocation rows FOR UPDATE, then check
      // available = allowance − (used + reserved). The lock serializes
      // concurrent same-type submits, so two can't both pass the check.
      return await this.dataSource.transaction(async (manager) => {
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

        // Persist the attachment row in the SAME transaction so the file
        // and the request commit atomically.
        const attachment_id = prepared
          ? (await this.attachments.persist(prepared, manager)).id
          : null;

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
            attachment_id,
            created_by: actor.id,
          },
          manager,
        );
      });
    } catch (err) {
      // The uploads can't enlist in the SQL transaction; if the commit
      // failed after objects were written, best-effort delete them.
      if (prepared) await this.attachments.cleanup(prepared);
      throw err;
    }
  }

  /**
   * Stream a leave request's attachment to an authorized caller. Access is
   * the SAME rule as viewing the request itself (`findByIdForViewer`):
   * owner, snapshotted L1/L2 approver, `LEAVE:ViewAll`, or `system_admin`.
   * The snapshot columns are the authority for who approved *this* request,
   * so there is no `approval_chains` lookup (the chain may have changed).
   *
   * 404s if the request has no attachment, the attachment row is gone, or a
   * `preview`/`thumbnail` is requested for a PDF (no such version).
   */
  async getAttachmentDownload(
    id: number,
    caller: User,
    version: FileVersion,
  ): Promise<AttachmentDownload> {
    // Reuses the request view-authorization (404 if missing, 403 if not allowed).
    const request = await this.findByIdForViewer(id, caller);
    if (request.attachment_id == null) {
      throw new NotFoundException('This leave request has no attachment');
    }
    const attachment = await this.attachments.findById(request.attachment_id);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    // PDFs have only `original`; reject derived versions for them.
    if (version !== FILE_VERSIONS.original && !attachment.has_versions) {
      throw new NotFoundException(`No ${version} rendition for this attachment`);
    }

    const stream = await this.attachments.openVersion(attachment, version);
    const isOriginal = version === FILE_VERSIONS.original;
    return {
      stream,
      content_type: isOriginal ? attachment.content_type : 'image/webp',
      filename: isOriginal
        ? attachment.original_filename
        : derivedFilename(attachment.original_filename, version),
    };
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

  /**
   * Cancel an active request. Allowed for the requester or a `LEAVE:Delete`
   * holder. A request is cancellable while it is **active** (pending or
   * approved) AND has not fully elapsed (`end_date >= today`); a leave in
   * progress is still cancellable, only a wholly-past one is locked. Balance
   * is derived from status, so flipping to `cancelled` frees the days with no
   * ledger work.
   */
  async cancel(id: number, caller: User): Promise<LeaveRequest> {
    const row = await this.findById(id);
    // Terminal requests (rejected / already cancelled) can never be cancelled.
    if (!isActive(row.status)) {
      throw conflict('status', `Cannot cancel a request in state ${row.status}.`);
    }
    // Active, but the leave window has already fully elapsed.
    if (row.end_date < this.dayCount.today()) {
      throw conflict('status', 'Cannot cancel a leave that has already ended.');
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
      throw conflict(
        'status',
        `Cannot edit a request in state ${row.status}. Use cancel + resubmit.`,
      );
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
      throw conflict('status', `Cannot approve a request in state ${row.status}.`);
    }
    if (!this.canActOn(row, caller)) {
      throw forbidden('approver', 'Not the assigned approver for this step.');
    }

    const override = isOverride(caller);
    if (!override) {
      // Normal path: the assigned step approver must still be active.
      const stepApproverId =
        row.status === LEAVE_REQUEST_STATUSES.pending_l1 ? row.l1_approver_id : row.l2_approver_id;
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
      throw conflict('status', `Cannot reject a request in state ${row.status}.`);
    }
    if (!this.canActOn(row, caller)) {
      throw forbidden('approver', 'Not the assigned approver for this step.');
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
    // Chain match: caller is the snapshotted approver for the current step.
    // (`caller.id` is a number, so an equality check already excludes a null
    // approver id — no separate null guard needed.)
    if (request.status === LEAVE_REQUEST_STATUSES.pending_l1) {
      return caller.id === request.l1_approver_id;
    }
    if (request.status === LEAVE_REQUEST_STATUSES.pending_l2) {
      return caller.id === request.l2_approver_id;
    }
    return false;
  }
}

/** A streamable attachment version plus the headers the controller sets. */
export type AttachmentDownload = {
  stream: Readable;
  content_type: string;
  filename: string;
};

/** `report.pdf` + `preview` → `report-preview.webp` (derived versions are WebP). */
function derivedFilename(originalFilename: string, version: FileVersion): string {
  const stem = originalFilename.replace(/\.[^.]+$/, '') || 'attachment';
  return `${stem}-${version}.webp`;
}

function isPending(status: LeaveRequestStatus): boolean {
  return (
    status === LEAVE_REQUEST_STATUSES.pending_l1 || status === LEAVE_REQUEST_STATUSES.pending_l2
  );
}

/** Non-terminal states: still in the chain (pending) or decided-approved. */
function isActive(status: LeaveRequestStatus): boolean {
  return isPending(status) || status === LEAVE_REQUEST_STATUSES.approved;
}

function isOverride(caller: User): boolean {
  return caller.system_admin === true || hasPermission(caller, 'LEAVE:ApproveAny');
}
