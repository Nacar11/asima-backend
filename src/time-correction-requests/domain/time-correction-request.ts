import {
  TcDecisionPath,
  TimeCorrectionStatus,
} from '@/time-correction-requests/time-correction-requests.constants';

/**
 * Time-correction request domain record — the persisted shape, as pure data.
 *
 * Like leave, a submitted request is an **audit object** (ADR 0001): the
 * requester cancels + resubmits rather than editing; HR can edit a still-
 * pending request under `TIME_CORRECTION:Update`. `l1_approver_id` /
 * `l2_approver_id` are a SNAPSHOT of the active chain at submit time.
 *
 * `target_entry_id` is NULL for a missed-punch (no existing row to fix); on
 * approval a new `time_entries` row is created. Otherwise it points at the
 * entry that gets updated.
 *
 * Pure TS — no `@nestjs/*`, no `typeorm`. The HTTP/Swagger shape lives in
 * `dto/response/time-correction-request-response.dto.ts`; the lifecycle
 * behavior lives on `domain/time-correction-request.aggregate.ts`. Field order
 * mirrors `mapper.toDomain` (which drives JSON key order — keep them in sync).
 */
export class TimeCorrectionRequestRecord {
  id!: number;

  /** FK to users.id — the requester. */
  employee_id!: number;

  /** FK to time_entries.id; NULL = missed-punch (no row to correct). */
  target_entry_id!: number | null;

  /**
   * The target entry's current time_in, resolved by join. NULL when no target
   * entry (new log) or the join was not loaded. Lets the UI render the
   * original→proposed diff.
   */
  original_time_in!: Date | null;

  /** The target entry's current time_out, resolved by join. NULL otherwise. */
  original_time_out!: Date | null;

  /** Work date being corrected (YYYY-MM-DD). */
  work_date!: string;

  proposed_time_in!: Date;

  /** NULL = open segment (no time_out). */
  proposed_time_out!: Date | null;

  reason!: string;

  status!: TimeCorrectionStatus;

  submitted_at!: Date;

  decided_at!: Date | null;

  decided_by!: number | null;

  decision_note!: string | null;

  /** chain = assigned approver acted; override = ApproveAny/system_admin bypass. */
  decision_path!: TcDecisionPath | null;

  cancelled_at!: Date | null;

  cancelled_by!: number | null;

  /** Snapshot of the L1 approver at submit time (NOT NULL). */
  l1_approver_id!: number;

  /** Snapshot of the L2 approver; null = single-step chain. */
  l2_approver_id!: number | null;

  created_by!: number | null;

  updated_by!: number | null;

  deleted_by!: number | null;

  created_at!: Date;

  updated_at!: Date;

  deleted_at!: Date | null;
}
