/**
 * Approval-chain steps. The schema supports any positive `step` int, but
 * the v1 service + UI explicitly assume a two-level chain (L1 → L2).
 * Promoting to N levels later is a DTO + UI change, not a schema change
 * (2026-05-30 plan §13).
 */
export const APPROVAL_STEP = {
  L1: 1,
  L2: 2,
} as const;

export type ApprovalStep = (typeof APPROVAL_STEP)[keyof typeof APPROVAL_STEP];
