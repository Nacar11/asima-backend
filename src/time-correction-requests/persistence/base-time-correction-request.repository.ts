import { EntityManager } from 'typeorm';
import { TimeCorrectionRequest } from '@/time-correction-requests/domain/time-correction-request';
import { TimeCorrectionRequestSearchCriteria } from '@/time-correction-requests/domain/time-correction-request-search-criteria';
import { FindAllTimeCorrectionRequest } from '@/time-correction-requests/domain/find-all-time-correction-request';
import {
  TcDecisionPath,
  TimeCorrectionStatus,
} from '@/time-correction-requests/time-correction-requests.constants';

export abstract class BaseTimeCorrectionRequestRepository {
  abstract findAll(
    criteria: TimeCorrectionRequestSearchCriteria,
  ): Promise<FindAllTimeCorrectionRequest>;

  abstract findById(id: number): Promise<TimeCorrectionRequest | null>;

  /**
   * Pending/approved correction requests for an employee on a given
   * work_date. Drives the "one open correction per (employee, work_date)"
   * submit guard (plan §10).
   */
  abstract findActiveForEmployeeDate(
    employee_id: number,
    work_date: string,
  ): Promise<TimeCorrectionRequest[]>;

  /**
   * Pending/approved correction requests that target a specific time entry.
   * Drives the "one open correction per entry" submit guard (per-entry model:
   * a regular shift and an OT entry on the same day are corrected separately).
   */
  abstract findActiveForEntry(target_entry_id: number): Promise<TimeCorrectionRequest[]>;

  abstract findPendingForApprover(approver_id: number): Promise<TimeCorrectionRequest[]>;

  abstract findAllPending(): Promise<TimeCorrectionRequest[]>;

  /**
   * Active (pending/approved) corrections for an employee with
   * `work_date >= from_date` — the candidates a forward-only schedule change
   * can still touch. Read inside `manager`'s transaction when supplied. Backs
   * the schedule-change cascade (plan Task 3).
   */
  abstract findActiveCandidatesForScheduleChange(
    employee_id: number,
    from_date: string,
    manager?: EntityManager,
  ): Promise<TimeCorrectionRequest[]>;

  /**
   * System cancel of the given corrections as part of a schedule change —
   * flips active rows to `cancelled` with audit fields + `note` inside
   * `manager`'s transaction, skipping the per-user ownership check. Returns the
   * rows affected (terminal rows are a no-op via the status guard).
   */
  abstract systemCancel(
    ids: number[],
    actor_id: number,
    note: string,
    manager?: EntityManager,
  ): Promise<number>;

  abstract create(input: {
    employee_id: number;
    target_entry_id?: number | null;
    work_date: string;
    proposed_time_in: Date;
    proposed_time_out?: Date | null;
    reason: string;
    status: TimeCorrectionStatus;
    l1_approver_id: number;
    l2_approver_id: number | null;
    created_by?: number | null;
  }): Promise<TimeCorrectionRequest>;

  abstract update(
    id: number,
    patch: {
      work_date?: string;
      proposed_time_in?: Date;
      proposed_time_out?: Date | null;
      reason?: string;
      status?: TimeCorrectionStatus;
      decided_at?: Date | null;
      decided_by?: number | null;
      decision_note?: string | null;
      decision_path?: TcDecisionPath | null;
      cancelled_at?: Date | null;
      cancelled_by?: number | null;
      updated_by?: number | null;
    },
  ): Promise<TimeCorrectionRequest>;
}
