/**
 * Leave-request enums. Postgres enum + const-object pattern (mirrors
 * `TIME_ENTRY_STATUSES`). Balances/quotas land via the `leave_allocations`
 * ledger (2026-05-31 leave-balances plan). `vacation` + `sick` carry a 10-day
 * default per employee; `bereavement` / `birthday` / `emergency` are
 * admin-granted only.
 */
export const LEAVE_TYPES = {
  vacation: 'vacation',
  sick: 'sick',
  bereavement: 'bereavement',
  birthday: 'birthday',
  emergency: 'emergency',
} as const;

export type LeaveType = (typeof LEAVE_TYPES)[keyof typeof LEAVE_TYPES];

/**
 * Request lifecycle. See the state machine in plan §3.2:
 *   pending_l1 → pending_l2 → approved   (L2 assigned)
 *   pending_l1 → approved                (single-step chain)
 *   pending_l1 | pending_l2 → rejected | cancelled
 */
export const LEAVE_REQUEST_STATUSES = {
  pending_l1: 'pending_l1',
  pending_l2: 'pending_l2',
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
} as const;

export type LeaveRequestStatus =
  (typeof LEAVE_REQUEST_STATUSES)[keyof typeof LEAVE_REQUEST_STATUSES];

/** The pending states an approver can still act on. */
export const PENDING_STATUSES: LeaveRequestStatus[] = [
  LEAVE_REQUEST_STATUSES.pending_l1,
  LEAVE_REQUEST_STATUSES.pending_l2,
];

/**
 * How a decision was reached — `chain` = the assigned approver acted;
 * `override` = an `ApproveAny` / `system_admin` holder used the bypass.
 * Recorded for audit (plan §3.2 S2 fix).
 */
export const DECISION_PATHS = {
  chain: 'chain',
  override: 'override',
} as const;

export type DecisionPath = (typeof DECISION_PATHS)[keyof typeof DECISION_PATHS];
