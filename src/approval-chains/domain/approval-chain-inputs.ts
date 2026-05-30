/**
 * Service-layer input shapes for approval-chain operations.
 *
 * `SetChainInput` uses a tri-state per field:
 *   - key absent (`undefined`) → leave that step unchanged
 *   - `null`                   → clear (logically end) that step
 *   - `number`                 → set that step to the given approver
 *
 * This mirrors the PATCH /admin/approvers/:employee_id semantics: an HR
 * admin can update just L1 without touching L2.
 */
export type SetChainInput = {
  l1_approver_id?: number | null;
  l2_approver_id?: number | null;
};

/** Active L1 / L2 lookup returned by `getActive`. */
export type ActiveChain = {
  l1_approver_id: number | null;
  l2_approver_id: number | null;
};

/** Result of a bulk reassignment. */
export type BulkReassignResult = {
  reassigned: number;
  /** employee_ids skipped because reassigning would make them their own approver. */
  skipped: number[];
};

/**
 * One row in the `GET /admin/approvers` list — an employee plus their
 * current L1/L2 approver, resolved for display. Names are denormalized
 * at read time so the admin table needs no second round-trip.
 */
export type EmployeeChainView = {
  employee_id: number;
  employee_name: string;
  employee_email: string;
  l1_approver_id: number | null;
  l1_approver_name: string | null;
  l2_approver_id: number | null;
  l2_approver_name: string | null;
  updated_at: Date | null;
};
