import { Injectable } from '@nestjs/common';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';
import { BaseLeaveRequestRepository } from '@/leave-requests/persistence/base-leave-request.repository';
import { LeaveBalance } from '@/leave-requests/domain/leave-balance';
import { LEAVE_TYPES } from '@/leave-requests/leave-requests.constants';

/**
 * Computes per-type leave balances for an employee. Balance is **derived**,
 * not stored: `allowance` from the allocation ledger, `used`/`reserved` from
 * approved/pending request working-days (plan D1).
 *
 * Always returns one row per `LEAVE_TYPES` value — it iterates the enum, not
 * the ledger rows, so types with no grants (bereavement/birthday/emergency)
 * still appear with zeros instead of vanishing (plan C2). Two grouped queries,
 * no per-type loop.
 */
@Injectable()
export class LeaveBalanceService {
  constructor(
    private readonly allocations: BaseLeaveAllocationRepository,
    private readonly requests: BaseLeaveRequestRepository,
  ) {}

  async forEmployee(employee_id: number): Promise<LeaveBalance[]> {
    const allowances = await this.allocations.sumsByEmployee(employee_id);
    const consumed = await this.requests.workingDaySumsByEmployee(employee_id);

    return Object.values(LEAVE_TYPES).map((leave_type) => {
      const allowance = allowances[leave_type] ?? 0;
      const used = consumed[leave_type]?.used ?? 0;
      const reserved = consumed[leave_type]?.reserved ?? 0;
      return {
        leave_type,
        allowance,
        used,
        reserved,
        available: Math.max(0, allowance - used - reserved),
      };
    });
  }
}
