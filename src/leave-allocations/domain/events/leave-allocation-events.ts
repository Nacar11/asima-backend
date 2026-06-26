import { DomainEvent } from '@/utils/domain/domain-event';
import { LeaveType } from '@/leave-requests/leave-requests.constants';
import { AllocationSource } from '@/leave-allocations/leave-allocations.constants';

/**
 * Domain event raised when a grant is appended to the ledger. The use-case
 * builds it AFTER the insert (so it carries the DB-generated `allocation_id`)
 * and publishes it post-commit — the aggregate does not buffer it, mirroring
 * `LeaveRequestSubmitted` (plan decision #4). No subscriber reacts yet; this
 * establishes the seam. Note (decision #9): the 2 default grants on user
 * creation bypass the use-case, so this fires for admin grants only.
 *
 * Past-tense name; carries ids + scalars, never whole aggregates.
 */
export class LeaveAllocationGranted extends DomainEvent {
  readonly name = 'allocation.granted';
  constructor(
    readonly allocation_id: number,
    readonly employee_id: number,
    readonly leave_type: LeaveType,
    readonly amount: number,
    readonly source: AllocationSource,
    readonly granted_by: number | null,
  ) {
    super();
  }
}
