import { DomainEvent } from '@/utils/domain/domain-event';
import { TcDecisionPath } from '@/time-correction-requests/time-correction-requests.constants';

/**
 * Domain events raised by the `TimeCorrectionRequest` aggregate. The use-case
 * drains them with `pullEvents()` and publishes them after the save commits.
 * No subscriber changes behavior yet (decision #6) — these establish the seam.
 *
 * Past-tense names; carry IDs and scalars, never whole aggregates.
 */

export class TimeCorrectionSubmitted extends DomainEvent {
  readonly name = 'time_correction.submitted';
  constructor(
    readonly time_correction_request_id: number,
    readonly employee_id: number,
    readonly l1_approver_id: number,
  ) {
    super();
  }
}

export class TimeCorrectionApproved extends DomainEvent {
  readonly name = 'time_correction.approved';
  constructor(
    readonly time_correction_request_id: number,
    readonly employee_id: number,
    readonly decided_by: number,
    readonly decision_path: TcDecisionPath,
  ) {
    super();
  }
}

export class TimeCorrectionAdvancedToL2 extends DomainEvent {
  readonly name = 'time_correction.advanced_to_l2';
  constructor(
    readonly time_correction_request_id: number,
    readonly employee_id: number,
    readonly l2_approver_id: number,
  ) {
    super();
  }
}

export class TimeCorrectionRejected extends DomainEvent {
  readonly name = 'time_correction.rejected';
  constructor(
    readonly time_correction_request_id: number,
    readonly employee_id: number,
    readonly decided_by: number,
  ) {
    super();
  }
}

export class TimeCorrectionCancelled extends DomainEvent {
  readonly name = 'time_correction.cancelled';
  constructor(
    readonly time_correction_request_id: number,
    readonly employee_id: number,
    readonly cancelled_by: number,
  ) {
    super();
  }
}
