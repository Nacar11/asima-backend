/**
 * Pure leave-row generator (no DB / Nest imports). Given one employee + their
 * seeded chain approvers, produces a consistent spread of leave rows:
 *
 *   pending_l1 (vacation)               -> sits in the L1 approver's inbox
 *   pending_l2 (vacation)  [if L2]      -> sits in the L2 approver's inbox (C2)
 *   approved   (sick|vacation)          -> decided by the final approver (I5)
 *   rejected|cancelled (zero-grant type)-> no balance impact (C1)
 *
 * Invariants by construction: consuming states use only allocation-backed types
 * (vacation/sick, C1); zero-grant types only appear rejected/cancelled; every
 * start_date is a weekday with working_days = 1 (I2); the status<->decision
 * fields are always consistent (I5). `requires_attachment` flags sick/bereavement
 * — the service attaches the per-employee placeholder (R1).
 */
export type LeaveStatus = 'pending_l1' | 'pending_l2' | 'approved' | 'rejected' | 'cancelled';
export type LeaveType = 'vacation' | 'sick' | 'bereavement' | 'birthday' | 'emergency';

export interface BuildLeaveInput {
  employee_id: number;
  l1_approver_id: number;
  l2_approver_id: number | null;
  admin_id: number | null;
  base_date: string; // a Monday (YYYY-MM-DD)
  with_attachment_types: boolean;
}

export interface LeaveRowSpec {
  employee_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  working_days: number;
  day_portion: 'full';
  status: LeaveStatus;
  reason: string | null;
  submitted_at: Date;
  decided_at: Date | null;
  decided_by: number | null;
  decision_note: string | null;
  decision_path: 'chain' | null;
  cancelled_at: Date | null;
  cancelled_by: number | null;
  l1_approver_id: number;
  l2_approver_id: number | null;
  requires_attachment: boolean;
  created_by: number | null;
}

/** The `offset`-th weekday on/after `baseISO` (skips Sat/Sun). */
function nthWeekday(baseISO: string, offset: number): string {
  const d = new Date(baseISO + 'T00:00:00Z');
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  let added = 0;
  while (added < offset) {
    d.setUTCDate(d.getUTCDate() + 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return d.toISOString().slice(0, 10);
}

const at = (dateISO: string, hour: number): Date =>
  new Date(`${dateISO}T${String(hour).padStart(2, '0')}:00:00Z`);

export function buildLeaveRows(input: BuildLeaveInput): LeaveRowSpec[] {
  const { employee_id, l1_approver_id, l2_approver_id, admin_id, base_date } = input;
  const finalApprover = l2_approver_id ?? l1_approver_id;

  const row = (
    leave_type: LeaveType,
    offset: number,
    status: LeaveStatus,
    reason: string,
  ): LeaveRowSpec => {
    const start = nthWeekday(base_date, offset);
    return {
      employee_id,
      leave_type,
      start_date: start,
      end_date: start,
      working_days: 1,
      day_portion: 'full',
      status,
      reason,
      submitted_at: at(start, 8),
      decided_at: null,
      decided_by: null,
      decision_note: null,
      decision_path: null,
      cancelled_at: null,
      cancelled_by: null,
      l1_approver_id,
      l2_approver_id,
      requires_attachment: leave_type === 'sick' || leave_type === 'bereavement',
      created_by: admin_id,
    };
  };

  const decided = (r: LeaveRowSpec, note: string): LeaveRowSpec => {
    r.decided_at = at(r.start_date, 9);
    r.decided_by = finalApprover;
    r.decision_path = 'chain';
    r.decision_note = note;
    return r;
  };

  const rows: LeaveRowSpec[] = [];

  rows.push(row('vacation', 0, 'pending_l1', 'Annual leave'));

  if (l2_approver_id != null) {
    rows.push(row('vacation', 2, 'pending_l2', 'Vacation — awaiting final approval'));
  }

  rows.push(
    decided(
      row(input.with_attachment_types ? 'sick' : 'vacation', 4, 'approved', 'Approved leave'),
      'Approved.',
    ),
  );

  if (input.with_attachment_types) {
    rows.push(
      decided(
        row('bereavement', 6, 'rejected', 'Bereavement — documentation incomplete'),
        'Rejected — please resubmit with documents.',
      ),
    );
  } else if (employee_id % 2 === 0) {
    const cancelled = row('emergency', 6, 'cancelled', 'Emergency — no longer needed');
    cancelled.cancelled_at = at(cancelled.start_date, 7);
    cancelled.cancelled_by = employee_id;
    rows.push(cancelled);
  } else {
    rows.push(decided(row('birthday', 6, 'rejected', 'Birthday leave'), 'Rejected.'));
  }

  return rows;
}
