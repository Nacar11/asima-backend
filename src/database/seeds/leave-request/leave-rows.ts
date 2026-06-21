/**
 * Pure leave-row generator (no DB / Nest imports). Given one employee + their
 * seeded chain approvers + a `variant_index`, produces a consistent spread of
 * leave rows. The PENDING L1 row varies by index for a realistic inbox:
 *
 *   pending_l1  -> sick (+cert) for attachment employees; otherwise a weighted
 *                  rotation of vacation/birthday/emergency, with half-day or
 *                  2-day duration variety (by index % 5)
 *   pending_l2  -> vacation (if the chain has an L2, C2), distinct date
 *   approved    -> sick|vacation (allocation-backed, C1), decided by final approver
 *   rejected|cancelled -> a zero-grant type (history)
 *
 * Invariants by construction: every start_date is a weekday and working_days
 * >= 0.5 (I2); status<->decision fields stay consistent (I5); approved rows use
 * only allocation-backed types so balances stay clean (C1). `sick` always carries
 * the per-employee attachment (R1). Zero-grant types MAY now appear pending
 * (Phase 2 — accepted negative balance). The service sets `start_time`/`end_time`
 * for half-day rows from the seeded schedule.
 */
export type LeaveStatus = 'pending_l1' | 'pending_l2' | 'approved' | 'rejected' | 'cancelled';
export type LeaveType = 'vacation' | 'sick' | 'bereavement' | 'birthday' | 'emergency';
export type DayPortion = 'full' | 'first_half' | 'second_half';

export interface BuildLeaveInput {
  employee_id: number;
  l1_approver_id: number;
  l2_approver_id: number | null;
  admin_id: number | null;
  base_date: string; // a Monday (YYYY-MM-DD)
  with_attachment_types: boolean;
  /** Employee's index in the seed order — drives type/date/duration variety. */
  variant_index: number;
}

export interface LeaveRowSpec {
  employee_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  working_days: number;
  day_portion: DayPortion;
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

// Without an attachment, pending L1 rotates these (sick is reserved for the
// attachment-having employees so their cert shows in the inbox). Vacation is
// weighted (allocation-backed, clean balance) with birthday/emergency as
// occasional zero-grant variety. Indexed by % 4 to decorrelate from the % 5
// duration slot.
const NON_ATTACH_TYPES: LeaveType[] = ['vacation', 'birthday', 'vacation', 'emergency'];
const HALF_DAY_OK = new Set<LeaveType>(['vacation', 'sick', 'emergency']);
const MULTI_DAY_OK = new Set<LeaveType>(['vacation', 'sick']);
const L1_REASON: Record<LeaveType, string> = {
  vacation: 'Annual leave',
  sick: 'Sick — medical certificate attached',
  birthday: 'Birthday leave',
  emergency: 'Family emergency',
  bereavement: 'Bereavement',
};

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
  const { employee_id, l1_approver_id, l2_approver_id, admin_id, base_date, variant_index } = input;
  const finalApprover = l2_approver_id ?? l1_approver_id;
  const base = variant_index % 8; // stagger each employee's block across weekdays

  const row = (
    leave_type: LeaveType,
    startOffset: number,
    endOffset: number,
    working_days: number,
    day_portion: DayPortion,
    status: LeaveStatus,
    reason: string,
  ): LeaveRowSpec => {
    const start = nthWeekday(base_date, startOffset);
    return {
      employee_id,
      leave_type,
      start_date: start,
      end_date: nthWeekday(base_date, endOffset),
      working_days,
      day_portion,
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

  // 1. pending L1 — sick (with the cert) for attachment employees; the rest
  // rotate vacation/birthday/emergency. Plus half-day / 2-day duration variety.
  const l1Type: LeaveType = input.with_attachment_types
    ? 'sick'
    : NON_ATTACH_TYPES[variant_index % 4]!;
  let l1Days = 1;
  let l1Portion: DayPortion = 'full';
  let l1End = base;
  const slot = variant_index % 5;
  if (slot === 0 && HALF_DAY_OK.has(l1Type)) {
    l1Portion = 'first_half';
    l1Days = 0.5;
  } else if (slot === 1 && MULTI_DAY_OK.has(l1Type)) {
    l1Days = 2;
    l1End = base + 1;
  }
  rows.push(row(l1Type, base, l1End, l1Days, l1Portion, 'pending_l1', L1_REASON[l1Type]));

  // 2. pending L2 — vacation, distinct date (only if the chain has an L2)
  if (l2_approver_id != null) {
    rows.push(
      row(
        'vacation',
        base + 2,
        base + 2,
        1,
        'full',
        'pending_l2',
        'Vacation — awaiting final approval',
      ),
    );
  }

  // 3. approved — allocation-backed (sick with the cert, else vacation)
  rows.push(
    decided(
      row(
        input.with_attachment_types ? 'sick' : 'vacation',
        base + 4,
        base + 4,
        1,
        'full',
        'approved',
        'Approved leave',
      ),
      'Approved.',
    ),
  );

  // 4. resolved-negative — a zero-grant type (history)
  if (input.with_attachment_types) {
    rows.push(
      decided(
        row(
          'bereavement',
          base + 6,
          base + 6,
          1,
          'full',
          'rejected',
          'Bereavement — documentation incomplete',
        ),
        'Rejected — please resubmit with documents.',
      ),
    );
  } else if (employee_id % 2 === 0) {
    const cancelled = row(
      'emergency',
      base + 6,
      base + 6,
      1,
      'full',
      'cancelled',
      'Emergency — no longer needed',
    );
    cancelled.cancelled_at = at(cancelled.start_date, 7);
    cancelled.cancelled_by = employee_id;
    rows.push(cancelled);
  } else {
    rows.push(
      decided(
        row('birthday', base + 6, base + 6, 1, 'full', 'rejected', 'Birthday leave'),
        'Rejected.',
      ),
    );
  }

  return rows;
}
