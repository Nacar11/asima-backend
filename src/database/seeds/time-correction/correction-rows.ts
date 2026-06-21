/**
 * Pure time-correction row generator (no DB / Nest imports). Given one employee,
 * their chain approvers, and their seeded time entries, produces a small spread:
 *
 *   pending_l1  -> correct a late clock-in on entry[0] (sits in L1 inbox)
 *   approved    -> corrected clock-out on entry[1] (decided by final approver, I5)
 *   rejected    -> a "missing punch" with no target entry (R8)
 *
 * Columns match the entity (R2): `proposed_time_in` (NOT NULL),
 * `proposed_time_out` (nullable, `> in` when present), `reason` (NOT NULL),
 * `target_entry_id` (nullable). Work_dates are distinct per row so the
 * idempotency key `(employee_id, work_date)` never collides.
 */
export type CorrectionStatus = 'pending_l1' | 'pending_l2' | 'approved' | 'rejected' | 'cancelled';

export interface SeedEntry {
  id: number;
  work_date: string;
  time_in: Date;
  time_out: Date | null;
}

export interface BuildCorrectionInput {
  employee_id: number;
  l1_approver_id: number;
  l2_approver_id: number | null;
  admin_id: number | null;
  entries: SeedEntry[];
}

export interface CorrectionRowSpec {
  employee_id: number;
  target_entry_id: number | null;
  work_date: string;
  proposed_time_in: Date;
  proposed_time_out: Date | null;
  reason: string;
  status: CorrectionStatus;
  submitted_at: Date;
  decided_at: Date | null;
  decided_by: number | null;
  decision_note: string | null;
  decision_path: 'chain' | null;
  cancelled_at: Date | null;
  cancelled_by: number | null;
  l1_approver_id: number;
  l2_approver_id: number | null;
  created_by: number | null;
}

const minutes = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);

export function buildCorrectionRows(input: BuildCorrectionInput): CorrectionRowSpec[] {
  const { employee_id, l1_approver_id, l2_approver_id, admin_id, entries } = input;
  const finalApprover = l2_approver_id ?? l1_approver_id;

  const base = (
    entry: SeedEntry | null,
    work_date: string,
    proposed_time_in: Date,
    proposed_time_out: Date | null,
    status: CorrectionStatus,
    reason: string,
  ): CorrectionRowSpec => ({
    employee_id,
    target_entry_id: entry ? entry.id : null,
    work_date,
    proposed_time_in,
    proposed_time_out,
    reason,
    status,
    submitted_at: minutes(proposed_time_in, 600),
    decided_at: null,
    decided_by: null,
    decision_note: null,
    decision_path: null,
    cancelled_at: null,
    cancelled_by: null,
    l1_approver_id,
    l2_approver_id,
    created_by: admin_id,
  });

  const decided = (r: CorrectionRowSpec, note: string): CorrectionRowSpec => {
    r.decided_at = minutes(r.proposed_time_in, 660);
    r.decided_by = finalApprover;
    r.decision_path = 'chain';
    r.decision_note = note;
    return r;
  };

  const rows: CorrectionRowSpec[] = [];

  const e0 = entries[0];
  if (e0) {
    const out = e0.time_out ?? minutes(e0.time_in, 8 * 60);
    rows.push(
      base(
        e0,
        e0.work_date,
        minutes(e0.time_in, -15),
        out,
        'pending_l1',
        'Clocked in late by mistake — actual start was 15 minutes earlier.',
      ),
    );
  }

  const e1 = entries[1];
  if (e1) {
    const out = e1.time_out ?? minutes(e1.time_in, 8 * 60);
    rows.push(
      decided(
        base(
          e1,
          e1.work_date,
          e1.time_in,
          minutes(out, 30),
          'approved',
          'Forgot to clock out; left 30 minutes later.',
        ),
        'Approved.',
      ),
    );
  }

  const e2 = entries[2];
  if (e2) {
    rows.push(
      decided(
        base(
          null,
          e2.work_date,
          new Date(`${e2.work_date}T09:00:00Z`),
          null,
          'rejected',
          'No punch recorded for this day — please file with your manager.',
        ),
        'Rejected — insufficient evidence.',
      ),
    );
  }

  return rows;
}
