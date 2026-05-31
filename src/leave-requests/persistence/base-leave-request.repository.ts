import { EntityManager } from 'typeorm';
import { LeaveRequest } from '@/leave-requests/domain/leave-request';
import { LeaveRequestSearchCriteria } from '@/leave-requests/domain/leave-request-search-criteria';
import { FindAllLeaveRequest } from '@/leave-requests/domain/find-all-leave-request';
import {
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

  abstract findById(id: number): Promise<LeaveRequest | null>;

  /**
   * Pending/approved requests for an employee whose date range overlaps
   * [start_date, end_date]. Drives the Q4 overlap hard-block on submit.
   */
  abstract findOverlapping(
    employee_id: number,
    start_date: string,
    end_date: string,
  ): Promise<LeaveRequest[]>;

  /**
   * Rows a given user can currently act on as the assigned approver:
   * (pending_l1 AND l1 = user) OR (pending_l2 AND l2 = user).
   */
  abstract findPendingForApprover(approver_id: number): Promise<LeaveRequest[]>;

  /** Every currently-pending request (for ApproveAny / system_admin inbox). */
  abstract findAllPending(): Promise<LeaveRequest[]>;

  abstract create(
    input: {
      employee_id: number;
      leave_type: LeaveType;
      start_date: string;
      end_date: string;
      working_days: number;
      reason?: string | null;
      status: LeaveRequestStatus;
      l1_approver_id: number;
      l2_approver_id: number | null;
      created_by?: number | null;
    },
    manager?: EntityManager,
  ): Promise<LeaveRequest>;

  abstract update(
    id: number,
    patch: {
      leave_type?: LeaveType;
      start_date?: string;
      end_date?: string;
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
  ): Promise<LeaveRequest>;
}
