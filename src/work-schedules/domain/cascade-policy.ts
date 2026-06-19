import { WorkSchedule } from '@/work-schedules/domain/work-schedule';
import {
  AffectedRequest,
  CascadeDecision,
  ScheduleChangeIntent,
  TemporalClass,
  VersioningAction,
} from '@/work-schedules/domain/schedule-change';
import { CASCADE_PENDING_STATUSES } from '@/work-schedules/work-schedules.constants';
import { datesInRange, weekdayOf } from '@/utils/helpers/dates';

/**
 * Pure decision logic for the schedule-change cascade. No I/O, no framework —
 * the service feeds it the live row, the candidate requests, and "today", and
 * it decides what gets cancelled. See the plan's Part A for the rationale.
 */

/** Minimal shape of a leave candidate the policy needs (subset of LeaveRequest). */
export interface LeaveLike {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  day_portion: string; // 'full' | 'first_half' | 'second_half'
  status: string;
  leave_type: string | null;
  working_days: number;
}

/** Minimal shape of a time-correction candidate (subset of TimeCorrectionRequest). */
export interface CorrectionLike {
  id: number;
  employee_id: number;
  work_date: string;
  status: string;
}

/**
 * Decide how the live row is versioned. The C1 same-day edge: a row whose
 * `effective_from >= X` never took effect, so it is replaced (soft-deleted)
 * rather than ended at `X − 1`.
 */
export function planVersioning(
  live: Pick<WorkSchedule, 'effective_from'> | null,
  intent: ScheduleChangeIntent,
): VersioningAction {
  const unstarted = live != null && live.effective_from >= intent.effective_from;
  if (intent.mode === 'remove') {
    if (live == null) return 'noop';
    return unstarted ? 'delete_only' : 'end_only';
  }
  // modify
  if (live == null) return 'create';
  return unstarted ? 'replace' : 'end_and_create';
}

/** Whether the punch window (`expected_in`/`expected_out`) changes — drives corrections + leave. */
export function windowChanged(live: WorkSchedule, intent: ScheduleChangeIntent): boolean {
  if (intent.mode === 'remove') return true;
  return intent.expected_in !== live.expected_in || intent.expected_out !== live.expected_out;
}

/** Whether the break (length or start) changes — only matters for half-day leave. */
export function breakChanged(live: WorkSchedule, intent: ScheduleChangeIntent): boolean {
  if (intent.mode === 'remove') return true;
  return (
    intent.break_minutes !== live.break_minutes ||
    (intent.break_start ?? null) !== (live.break_start ?? null)
  );
}

/** Dates in `requestDates` that the change governs: on weekday W, on/after X. */
export function governedDates(requestDates: string[], intent: ScheduleChangeIntent): string[] {
  return requestDates.filter(
    (d) => d >= intent.effective_from && weekdayOf(d) === intent.day_of_week,
  );
}

/** Lexicographic YYYY-MM-DD comparison gives the right ordering. */
export function temporalClass(dates: string[], today: string): TemporalClass {
  const min = dates.reduce((a, b) => (a < b ? a : b));
  const max = dates.reduce((a, b) => (a > b ? a : b));
  if (max < today) return 'past';
  if (min > today) return 'future';
  return 'present';
}

function isPending(status: string): boolean {
  return (CASCADE_PENDING_STATUSES as readonly string[]).includes(status);
}

/**
 * The A.4 matrix. Affected + pending → cancel (present/future); affected +
 * approved → cancel only when entirely future; in-progress approved is kept.
 * Past never cancels (and cannot occur under the forward-only model).
 */
export function classify(temporal: TemporalClass, status: string): CascadeDecision {
  if (temporal === 'past') return 'keep';
  if (isPending(status)) return 'cancel';
  // approved (terminal statuses never reach here — they aren't candidates)
  return temporal === 'future' ? 'cancel' : 'keep';
}

/**
 * Evaluate a leave candidate. Returns an `AffectedRequest` (carrying its
 * decision) when the change touches it, else `null`.
 *
 * Affected predicate (A.3): removal touches any leave; a window/break change
 * touches a **half-day** leave (its snapshot window goes stale); a pure window
 * change does **not** touch a **full-day** leave (the whole day is off
 * regardless of clock window).
 */
export function evaluateLeave(
  leave: LeaveLike,
  live: WorkSchedule | null,
  intent: ScheduleChangeIntent,
  today: string,
): AffectedRequest | null {
  const dates = datesInRange(leave.start_date, leave.end_date);
  const triggers = governedDates(dates, intent);
  if (triggers.length === 0) return null;

  const isHalfDay = leave.day_portion !== 'full';
  let affected: boolean;
  if (intent.mode === 'remove') {
    affected = true;
  } else if (isHalfDay) {
    affected = (live != null && windowChanged(live, intent)) || (live != null && breakChanged(live, intent));
  } else {
    affected = false; // full-day modify
  }
  if (!affected) return null;

  const temporal = temporalClass(dates, today);
  return {
    kind: 'leave',
    id: leave.id,
    employee_id: leave.employee_id,
    status: leave.status,
    dates,
    trigger_dates: triggers,
    temporal,
    decision: classify(temporal, leave.status),
    leave_type: leave.leave_type,
    working_days: leave.working_days,
  };
}

/**
 * Evaluate a time-correction candidate. Affected when its `work_date` is
 * governed and the punch window changes (or the schedule is removed); a
 * break-only change does not touch a correction.
 */
export function evaluateCorrection(
  tc: CorrectionLike,
  live: WorkSchedule | null,
  intent: ScheduleChangeIntent,
  today: string,
): AffectedRequest | null {
  const triggers = governedDates([tc.work_date], intent);
  if (triggers.length === 0) return null;

  const affected = intent.mode === 'remove' || (live != null && windowChanged(live, intent));
  if (!affected) return null;

  const temporal = temporalClass([tc.work_date], today);
  return {
    kind: 'time_correction',
    id: tc.id,
    employee_id: tc.employee_id,
    status: tc.status,
    dates: [tc.work_date],
    trigger_dates: triggers,
    temporal,
    decision: classify(temporal, tc.status),
    leave_type: null,
    working_days: null,
  };
}
