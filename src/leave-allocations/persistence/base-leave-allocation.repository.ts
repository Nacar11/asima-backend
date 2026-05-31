import { EntityManager } from 'typeorm';
import { LeaveAllocation } from '@/leave-allocations/domain/leave-allocation';
import { CreateAllocationInput } from '@/leave-allocations/domain/leave-allocation-inputs';
import { LeaveType } from '@/leave-requests/leave-requests.constants';

export abstract class BaseLeaveAllocationRepository {
  /** Append a grant to the ledger. */
  abstract create(input: CreateAllocationInput): Promise<LeaveAllocation>;

  /** `SUM(amount)` of non-deleted grants for one (employee, type) — the allowance. */
  abstract sumByEmployeeAndType(employee_id: number, leave_type: LeaveType): Promise<number>;

  /**
   * Same sum, but inside `manager`'s transaction with `SELECT … FOR UPDATE`
   * on the matched rows. This is the serialization point for reserve-on-submit
   * (plan C3): two concurrent submits of the same (employee, type) contend on
   * these rows, so the second blocks until the first commits.
   */
  abstract sumForUpdate(
    manager: EntityManager,
    employee_id: number,
    leave_type: LeaveType,
  ): Promise<number>;

  /** Grant history for one employee, newest first (non-deleted). */
  abstract listForEmployee(employee_id: number): Promise<LeaveAllocation[]>;
}
