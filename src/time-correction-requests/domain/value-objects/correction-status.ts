import { ValueObject } from '@/utils/domain/value-object';
import {
  TIME_CORRECTION_STATUSES,
  TimeCorrectionStatus,
} from '@/time-correction-requests/time-correction-requests.constants';

/**
 * The lifecycle state of a time-correction request, as a value object.
 *
 *   pending_l1 → pending_l2 → approved   (L2 assigned)
 *   pending_l1 → approved                (single-step chain)
 *   pending_l1 | pending_l2 → rejected | cancelled
 *
 * Self-validating: constructing one from an unknown status throws, so an
 * invalid state can never exist on an aggregate.
 *
 * Deliberately **no `isActive()`** — unlike `LeaveStatus`, a correction is
 * cancellable only while pending (the aggregate's `cancel` is pending-only),
 * so a `pending | approved` helper would have no caller.
 */
export class CorrectionStatus extends ValueObject<{ value: TimeCorrectionStatus }> {
  constructor(value: TimeCorrectionStatus) {
    if (!Object.values(TIME_CORRECTION_STATUSES).includes(value)) {
      throw new Error(`Unknown time correction status: ${value}`);
    }
    super({ value });
  }

  get value(): TimeCorrectionStatus {
    return this.props.value;
  }

  /** Still in the approval chain — an approver can act on it. */
  isPending(): boolean {
    return (
      this.props.value === TIME_CORRECTION_STATUSES.pending_l1 ||
      this.props.value === TIME_CORRECTION_STATUSES.pending_l2
    );
  }
}
