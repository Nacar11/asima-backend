/**
 * The capabilities of whoever is acting on a leave request, distilled from
 * the `User` aggregate by the use-case so the `LeaveRequest` aggregate never
 * has to import `User`. Keeps the domain decoupled from identity/permissions.
 *
 * `can_*` map to permission codes:
 *   - can_approve      → LEAVE:Approve     (chain-path approver)
 *   - can_approve_any  → LEAVE:ApproveAny  (override; HR holds this, not Approve)
 *   - can_delete       → LEAVE:Delete      (HR cancel-on-behalf)
 * `is_system_admin` is the unconditional bypass axis (ADR 0001).
 */
export type LeaveActor = {
  user_id: number;
  is_system_admin: boolean;
  can_approve: boolean;
  can_approve_any: boolean;
  can_delete: boolean;
};
