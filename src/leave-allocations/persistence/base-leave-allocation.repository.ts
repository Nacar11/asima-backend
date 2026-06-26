import { EntityManager } from 'typeorm';
import { LeaveAllocationRecord } from '@/leave-allocations/domain/leave-allocation';
import { CreateAllocationInput } from '@/leave-allocations/domain/leave-allocation-inputs';
import { LeaveType } from '@/leave-requests/leave-requests.constants';

export abstract class BaseLeaveAllocationRepository {
  /** Append a grant to the ledger. */
  abstract create(input: CreateAllocationInput): Promise<LeaveAllocationRecord>;

  /**
   * All non-deleted grant sums for an employee, grouped by leave type, in one
   * query. Types with no grants are simply absent from the map (the balance
   * service defaults them to 0). Backs the balance read (plan C2).
   */
  abstract sumsByEmployee(employee_id: number): Promise<Partial<Record<LeaveType, number>>>;

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
  abstract listForEmployee(employee_id: number): Promise<LeaveAllocationRecord[]>;
}
