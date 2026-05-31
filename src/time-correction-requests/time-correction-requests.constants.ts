/**
 * Time-correction request lifecycle — same 2-step shape as leave
 * (plan §3.3). Kept module-local (not imported from leave) so the
 * modules stay decoupled; the DB reuses the shared `decision_path` enum.
 */
export const TIME_CORRECTION_STATUSES = {
  pending_l1: 'pending_l1',
  pending_l2: 'pending_l2',
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
} as const;

export type TimeCorrectionStatus =
  (typeof TIME_CORRECTION_STATUSES)[keyof typeof TIME_CORRECTION_STATUSES];

export const TC_PENDING_STATUSES: TimeCorrectionStatus[] = [
  TIME_CORRECTION_STATUSES.pending_l1,
  TIME_CORRECTION_STATUSES.pending_l2,
];

export const TC_DECISION_PATHS = {
  chain: 'chain',
  override: 'override',
} as const;

export type TcDecisionPath = (typeof TC_DECISION_PATHS)[keyof typeof TC_DECISION_PATHS];
