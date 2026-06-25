import { DomainEvent } from '@/utils/domain/domain-event';
import { DecisionPath } from '@/leave-requests/leave-requests.constants';

/**
 * Domain events raised by the `LeaveRequest` aggregate. The use-case drains
 * them with `pullEvents()` and publishes them after the save commits. No
 * subscriber changes behavior yet (decision #4) — these establish the seam.
 *
 * Past-tense names; carry IDs, never whole aggregates.
 */

export class LeaveRequestSubmitted extends DomainEvent {
  readonly name = 'leave.submitted';
  constructor(
    readonly leave_request_id: number,
    readonly employee_id: number,
    readonly l1_approver_id: number,
  ) {
    super();
  }
}

export class LeaveRequestApproved extends DomainEvent {
  readonly name = 'leave.approved';
  constructor(
    readonly leave_request_id: number,
    readonly employee_id: number,
    readonly decided_by: number,
    readonly decision_path: DecisionPath,
  ) {
    super();
  }
}

export class LeaveRequestAdvancedToL2 extends DomainEvent {
  readonly name = 'leave.advanced_to_l2';
  constructor(
    readonly leave_request_id: number,
    readonly employee_id: number,
    readonly l2_approver_id: number,
  ) {
    super();
  }
}

export class LeaveRequestRejected extends DomainEvent {
  readonly name = 'leave.rejected';
  constructor(
    readonly leave_request_id: number,
    readonly employee_id: number,
    readonly decided_by: number,
  ) {
    super();
  }
}

export class LeaveRequestCancelled extends DomainEvent {
  readonly name = 'leave.cancelled';
  constructor(
    readonly leave_request_id: number,
    readonly employee_id: number,
    readonly cancelled_by: number,
  ) {
    super();
  }
}
