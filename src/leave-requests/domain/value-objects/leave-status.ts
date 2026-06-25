import { ValueObject } from '@/utils/domain/value-object';
import {
  LEAVE_REQUEST_STATUSES,
  LeaveRequestStatus,
} from '@/leave-requests/leave-requests.constants';

/**
 * The lifecycle state of a leave request, as a value object.
 *
 *   pending_l1 → pending_l2 → approved   (L2 assigned)
 *   pending_l1 → approved                (single-step chain)
 *   pending_l1 | pending_l2 → rejected | cancelled
 *
 * Self-validating: constructing one from an unknown status throws, so an
 * invalid state can never exist on an aggregate.
 */
export class LeaveStatus extends ValueObject<{ value: LeaveRequestStatus }> {
  constructor(value: LeaveRequestStatus) {
    if (!Object.values(LEAVE_REQUEST_STATUSES).includes(value)) {
      throw new Error(`Unknown leave request status: ${value}`);
    }
    super({ value });
  }

  get value(): LeaveRequestStatus {
    return this.props.value;
  }

  /** Still in the approval chain — an approver can act on it. */
  isPending(): boolean {
    return (
      this.props.value === LEAVE_REQUEST_STATUSES.pending_l1 ||
      this.props.value === LEAVE_REQUEST_STATUSES.pending_l2
    );
  }

  /** Non-terminal: still pending, or decided-approved (cancellable). */
  isActive(): boolean {
    return this.isPending() || this.props.value === LEAVE_REQUEST_STATUSES.approved;
  }
}
