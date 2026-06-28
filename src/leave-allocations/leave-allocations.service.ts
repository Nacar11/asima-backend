import { Injectable } from '@nestjs/common';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { LeaveBalanceService } from '@/leave-requests/leave-balance.service';
import { LeaveAllocation } from '@/leave-allocations/domain/leave-allocation.aggregate';
import { LeaveAllocationRecord } from '@/leave-allocations/domain/leave-allocation';
import { LeaveAllocationGranted } from '@/leave-allocations/domain/events/leave-allocation-events';
import { InvalidAllocationAmountError } from '@/leave-allocations/domain/leave-allocation-errors';
import { LeaveBalance } from '@/leave-requests/domain/leave-balance';
import { ALLOCATION_SOURCES } from '@/leave-allocations/leave-allocations.constants';
import { LeaveType } from '@/leave-requests/leave-requests.constants';
import { DomainEventPublisher } from '@/utils/domain/domain-event-publisher';
import { notFound, unprocessable } from '@/utils/helpers/http-errors';
import { User } from '@/users/domain/user';

/**
 * Admin-facing leave-allocation operations: grant days, read grant history,
 * and read an employee's balances. Grants are append-only (`amount > 0`,
 * `source='admin_grant'`); the running allowance is `SUM(amount)`.
 *
 * The grant use-case is the canonical DDD shape: guard (aggregate) → persist
 * (port) → publish the creation event with the insert id (plan decision #4).
 */
@Injectable()
export class LeaveAllocationsService {
  constructor(
    private readonly allocations: BaseLeaveAllocationRepository,
    private readonly users: BaseUserRepository,
    private readonly balances: LeaveBalanceService,
    private readonly publisher: DomainEventPublisher,
  ) {}

  /** Grant `amount` days of `leave_type` to `employee_id`. Any amount, any number of times. */
  async grant(
    employee_id: number,
    input: { leave_type: LeaveType; amount: number; reason?: string | null },
    actor: User,
  ): Promise<LeaveAllocationRecord> {
    const employee = await this.users.findById(employee_id);
    if (!employee) throw notFound('User', employee_id);

    const source = ALLOCATION_SOURCES.admin_grant;

    // Creation invariant lives on the aggregate; it returns the validated
    // value object whose parsed value we persist. Map its plain domain error
    // to the 422 envelope so the domain stays framework-free.
    let amount: number;
    try {
      amount = LeaveAllocation.assertGrantable(input.amount).value;
    } catch (err) {
      this.rethrowDomainError(err);
    }

    const created = await this.allocations.create({
      employee_id,
      leave_type: input.leave_type,
      amount,
      source,
      reason: input.reason ?? null,
      granted_by: actor.id,
      created_by: actor.id,
    });

    // Commit succeeded — publish the creation event with the insert-generated
    // id (mirrors leave-requests submit). No subscriber reacts yet.
    this.publisher.publish([
      new LeaveAllocationGranted(
        created.id,
        created.employee_id,
        created.leave_type,
        created.amount,
        created.source,
        created.granted_by,
      ),
    ]);

    return created;
  }

  /** Grant history for an employee, newest first. */
  history(employee_id: number): Promise<LeaveAllocationRecord[]> {
    return this.allocations.listForEmployee(employee_id);
  }

  /** An employee's per-type balances (delegates to the shared computation). */
  balancesFor(employee_id: number): Promise<LeaveBalance[]> {
    return this.balances.forEmployee(employee_id);
  }

  /** Map the aggregate's plain domain error to the per-field 422 envelope. */
  private rethrowDomainError(err: unknown): never {
    if (err instanceof InvalidAllocationAmountError) throw unprocessable('amount', err.message);
    throw err;
  }
}
