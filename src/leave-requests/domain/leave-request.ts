import {
  DayPortion,
  DecisionPath,
  LeaveRequestStatus,
  LeaveType,
} from '@/leave-requests/leave-requests.constants';

/**
 * Leave-request domain record — the persisted shape, as pure data.
 *
 * A submitted request is an **audit object** (ADR 0001): the requester
 * cannot edit it after submission (only cancel + resubmit); HR can edit a
 * still-pending request under `LEAVE:Update`. `l1_approver_id` /
 * `l2_approver_id` are a SNAPSHOT of the employee's active approval chain at
 * submit time, so the request resolves to the approver who was assigned then
 * even after the chain is reassigned.
 *
 * Pure TS — no `@nestjs/*`, no `typeorm`. The HTTP/Swagger shape lives in
 * `dto/response/leave-request-response.dto.ts`; the lifecycle behavior lives
 * on `domain/leave-request.aggregate.ts`. This class is the data the
 * repository reads/writes and the read paths serialize through the assembler.
 */
export class LeaveRequestRecord {
  id!: number;

  /** FK to users.id — the requester. */
  employee_id!: number;

  leave_type!: LeaveType;

  /** YYYY-MM-DD, inclusive. */
  start_date!: string;

  /** YYYY-MM-DD, inclusive (>= start_date). */
  end_date!: string;

  /**
   * Scheduled working days in [start_date, end_date] — snapshot at submit
   * time. 0.5 for a half-day request.
   */
  working_days!: number;

  /** full | first_half | second_half. first/second_half charge 0.5, single-day only. */
  day_portion!: DayPortion;

  /** Half-day window start (HH:MM:SS), snapshot from the schedule. NULL for full day. */
  start_time!: string | null;

  /** Half-day window end (HH:MM:SS). NULL for full day. */
  end_time!: string | null;

  reason!: string | null;

  status!: LeaveRequestStatus;

  submitted_at!: Date;

  decided_at!: Date | null;

  /** Who closed the request. */
  decided_by!: number | null;

  decision_note!: string | null;

  /** chain = assigned approver acted; override = ApproveAny/system_admin bypass. */
  decision_path!: DecisionPath | null;

  cancelled_at!: Date | null;

  cancelled_by!: number | null;

  /** Snapshot of the L1 approver at submit time (NOT NULL). */
  l1_approver_id!: number;

  /** Snapshot of the L2 approver; null = single-step chain (auto-approve after L1). */
  l2_approver_id!: number | null;

  /** FK attachments.id — the mandatory file for sick/bereavement; null otherwise. */
  attachment_id!: number | null;

  created_by!: number | null;

  updated_by!: number | null;

  deleted_by!: number | null;

  created_at!: Date;

  updated_at!: Date;

  deleted_at!: Date | null;
}
