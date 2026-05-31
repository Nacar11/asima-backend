import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { LeaveBalanceService } from '@/leave-requests/leave-balance.service';
import { LeaveAllocation } from '@/leave-allocations/domain/leave-allocation';
import { LeaveBalance } from '@/leave-requests/domain/leave-balance';
import { ALLOCATION_SOURCES } from '@/leave-allocations/leave-allocations.constants';
import { LeaveType } from '@/leave-requests/leave-requests.constants';
import { User } from '@/users/domain/user';

/**
 * Admin-facing leave-allocation operations: grant days, read grant history,
 * and read an employee's balances. Grants are append-only (`amount > 0`,
 * `source='admin_grant'`); the running allowance is `SUM(amount)`.
 */
@Injectable()
export class LeaveAllocationsService {
  constructor(
    private readonly allocations: BaseLeaveAllocationRepository,
    private readonly users: BaseUserRepository,
    private readonly balances: LeaveBalanceService,
  ) {}

  /** Grant `amount` days of `leave_type` to `employee_id`. Any amount, any number of times. */
  async grant(
    employee_id: number,
    input: { leave_type: LeaveType; amount: number; reason?: string | null },
    actor: User,
  ): Promise<LeaveAllocation> {
    const employee = await this.users.findById(employee_id);
    if (!employee) throw new NotFoundException(`User with id ${employee_id} not found`);

    return this.allocations.create({
      employee_id,
      leave_type: input.leave_type,
      amount: input.amount,
      source: ALLOCATION_SOURCES.admin_grant,
      reason: input.reason ?? null,
      granted_by: actor.id,
      created_by: actor.id,
    });
  }

  /** Grant history for an employee, newest first. */
  history(employee_id: number): Promise<LeaveAllocation[]> {
    return this.allocations.listForEmployee(employee_id);
  }

  /** An employee's per-type balances (delegates to the shared computation). */
  balancesFor(employee_id: number): Promise<LeaveBalance[]> {
    return this.balances.forEmployee(employee_id);
  }
}
