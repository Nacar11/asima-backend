/**
 * The capabilities of whoever is acting on a time-correction request,
 * distilled from the `User` aggregate by the use-case so the
 * `TimeCorrectionRequest` aggregate never has to import `User`. Keeps the
 * domain decoupled from identity/permissions.
 *
 * Kept module-local (mirrors `LeaveActor`, does not import it) so the modules
 * stay decoupled — this is the 2nd approval workflow; a shared
 * `ApprovalActor` abstraction waits for the 3rd use case (YAGNI).
 *
 * `can_*` map to permission codes:
 *   - can_approve      → TIME_CORRECTION:Approve     (chain-path approver)
 *   - can_approve_any  → TIME_CORRECTION:ApproveAny  (override; HR holds this, not Approve)
 *   - can_delete       → TIME_CORRECTION:Delete      (HR cancel-on-behalf)
 * `is_system_admin` is the unconditional bypass axis (ADR 0001).
 */
export type CorrectionActor = {
  user_id: number;
  is_system_admin: boolean;
  can_approve: boolean;
  can_approve_any: boolean;
  can_delete: boolean;
};
