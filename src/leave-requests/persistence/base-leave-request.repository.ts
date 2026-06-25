import { EntityManager } from 'typeorm';
import { LeaveRequestRecord } from '@/leave-requests/domain/leave-request';
import { LeaveRequest } from '@/leave-requests/domain/leave-request.aggregate';
import { LeaveRequestSearchCriteria } from '@/leave-requests/domain/leave-request-search-criteria';
import { FindAllLeaveRequest } from '@/leave-requests/domain/find-all-leave-request';
import {
  DayPortion,
  DecisionPath,
  LeaveRequestStatus,
  LeaveType,
} from '@/leave-requests/leave-requests.constants';

/** used = SUM(working_days) approved; reserved = SUM(working_days) pending. */
export type WorkingDaySums = Partial<Record<LeaveType, { used: number; reserved: number }>>;

export abstract class BaseLeaveRequestRepository {
  abstract findAll(criteria: LeaveRequestSearchCriteria): Promise<FindAllLeaveRequest>;

  /**
   * Working-day sums for an employee grouped by leave type, split into
   * `used` (approved) and `reserved` (pending), in one query. Backs the
   * balance read (plan C2).
   */
  abstract workingDaySumsByEmployee(employee_id: number): Promise<WorkingDaySums>;

  /**
   * `used + reserved` working days for one (employee, type), read inside
   * `manager`'s transaction. Used by the reserve-on-submit check after the
   * allocation rows are locked (plan C3).
   */
  abstract sumConsumedForEmployeeType(
    manager: EntityManager,
    employee_id: number,
    leave_type: LeaveType,
  ): Promise<number>;

  abstract findById(id: number): Promise<LeaveRequestRecord | null>;

  /**
   * Load the rich aggregate for a write/transition (approve/reject/cancel).
   * Returns null on a miss — the service owns the 404. Distinct from
   * `findById` (the read-path data record) so reconstitution happens only
   * where behavior will run.
   */
  abstract findAggregateById(id: number): Promise<LeaveRequest | null>;

  /**
   * Pending/approved requests for an employee whose date range overlaps
   * [start_date, end_date]. Drives the Q4 overlap hard-block on submit.
   */
  abstract findOverlapping(
    employee_id: number,
    start_date: string,
    end_date: string,
  ): Promise<LeaveRequestRecord[]>;

  /**
   * Rows a given user can currently act on as the assigned approver:
   * (pending_l1 AND l1 = user) OR (pending_l2 AND l2 = user).
   */
  abstract findPendingForApprover(approver_id: number): Promise<LeaveRequestRecord[]>;

  /** Every currently-pending request (for ApproveAny / system_admin inbox). */
  abstract findAllPending(): Promise<LeaveRequestRecord[]>;

  /**
   * Active (pending/approved) requests for an employee whose range can still
   * be touched by a forward-only schedule change — `end_date >= from_date`.
   * Read inside `manager`'s transaction when one is supplied so the cascade's
   * recompute is isolated. Backs the schedule-change cascade (plan Task 2).
   */
  abstract findActiveCandidatesForScheduleChange(
    employee_id: number,
    from_date: string,
    manager?: EntityManager,
  ): Promise<LeaveRequestRecord[]>;

  /**
   * System cancel of the given requests as part of a schedule change: flips
   * active rows to `cancelled` with `cancelled_by`/`cancelled_at` and the audit
   * `note`, inside `manager`'s transaction. Skips the per-user ownership check
   * (justified by the upstream `SCHEDULE:*` gate). Returns the rows affected;
   * the status guard means an already-terminal row is a no-op.
   */
  abstract systemCancel(
    ids: number[],
    actor_id: number,
    note: string,
    manager?: EntityManager,
  ): Promise<number>;

  abstract create(
    input: {
      employee_id: number;
      leave_type: LeaveType;
      start_date: string;
      end_date: string;
      working_days: number;
      day_portion: DayPortion;
      start_time?: string | null;
      end_time?: string | null;
      reason?: string | null;
      status: LeaveRequestStatus;
      l1_approver_id: number;
      l2_approver_id: number | null;
      attachment_id?: number | null;
      created_by?: number | null;
    },
    manager?: EntityManager,
  ): Promise<LeaveRequestRecord>;

  abstract update(
    id: number,
    patch: {
      leave_type?: LeaveType;
      start_date?: string;
      end_date?: string;
      working_days?: number;
      day_portion?: DayPortion;
      start_time?: string | null;
      end_time?: string | null;
      reason?: string | null;
      status?: LeaveRequestStatus;
      decided_at?: Date | null;
      decided_by?: number | null;
      decision_note?: string | null;
      decision_path?: DecisionPath | null;
      cancelled_at?: Date | null;
      cancelled_by?: number | null;
      updated_by?: number | null;
    },
  ): Promise<LeaveRequestRecord>;
}
