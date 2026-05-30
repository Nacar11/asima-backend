/**
 * Leave-request enums. Postgres enum + const-object pattern (mirrors
 * `TIME_ENTRY_STATUSES`). No `leave_types` lookup table in v0 — quotas,
 * accrual, and balances are a v1 conversation (2026-05-30 plan §3.4 / §13).
 */
export const LEAVE_TYPES = {
  annual: 'annual',
  sick: 'sick',
  bereavement: 'bereavement',
  unpaid: 'unpaid',
  other: 'other',
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
