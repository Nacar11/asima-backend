import { Injectable } from '@nestjs/common';
import { unprocessable } from '@/utils/helpers/http-errors';
import { toClock, toSeconds } from '@/utils/helpers/time-of-day';
import { BaseWorkScheduleRepository } from '@/work-schedules/persistence/base-work-schedule.repository';
import { WorkScheduleRecord } from '@/work-schedules/domain/work-schedule';
import {
  DAY_PORTIONS,
  DayPortion,
  HALF_DAY_LEAVE_TYPES,
  LeaveType,
} from '@/leave-requests/leave-requests.constants';

/** Result of validating a range: the chargeable days + the half-day window. */
export type SubmittableRange = {
  working_days: number;
  /** Half-day window start (HH:MM:SS); null for a full-day request. */
  start_time: string | null;
  end_time: string | null;
};

/**
 * Business timezone used to decide "today" for the no-past-dates rule.
 * Mirrors the frontend's display policy (Asia/Manila in prod). Override
 * via `APP_TIMEZONE` if a deployment runs in another zone.
 */
const BUSINESS_TZ = process.env.APP_TIMEZONE ?? 'Asia/Manila';

const MS_PER_DAY = 86_400_000;

/**
 * Owns leave day-counting and the D8 submit date-rules, so submit and the
 * day-count preview endpoint enforce exactly the same thing.
 *
 * Chargeable leave days are **work-schedule-aware**: only the employee's
 * actively-scheduled weekdays in the inclusive range count. Because leave is
 * always future-dated (D8 blocks the past) and the schema allows at most one
 * *active* row per (employee, weekday), the active schedule IS the schedule
 * in effect on any submittable date — so the active weekday set is authoritative
 * and no historical per-date resolution is needed.
 */
@Injectable()
export class LeaveDayCountService {
  constructor(private readonly schedules: BaseWorkScheduleRepository) {}

  /** Today's date as `YYYY-MM-DD` in the business timezone. */
  today(): string {
    // en-CA formats as YYYY-MM-DD; timeZone pins it to the business day.
    return new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TZ }).format(new Date());
  }

  /** The weekdays (0=Sun..6=Sat) this employee is actively scheduled to work. */
  async activeWeekdays(employee_id: number): Promise<Set<number>> {
    const rows = await this.schedules.findActiveForEmployee(employee_id);
    return new Set(rows.map((r) => r.day_of_week));
  }

  async isWorkday(employee_id: number, date: string): Promise<boolean> {
    return (await this.activeWeekdays(employee_id)).has(weekdayOf(date));
  }

  /** Scheduled working days within [start_date, end_date] inclusive. */
  async countWorkingDays(
    employee_id: number,
    start_date: string,
    end_date: string,
  ): Promise<number> {
    const workdays = await this.activeWeekdays(employee_id);
    return countAgainst(workdays, start_date, end_date);
  }

  /**
   * D8: validate a requested range and return its working-day count plus,
   * for a half-day request, the snapshotted clock window. Throws 422
   * (per-field) on: end before start, start in the past, a non-workday
   * start/end boundary, a partial portion spanning more than one day, or a
   * partial portion on a whole-day-only leave type. Reused by submit and the
   * preview endpoint so both enforce identical rules.
   *
   * A single `findActiveForEmployee` read backs both the weekday set and the
   * window row — no second query.
   */
  async assertSubmittableRange(
    employee_id: number,
    start_date: string,
    end_date: string,
    day_portion: DayPortion = DAY_PORTIONS.full,
    leave_type?: LeaveType,
  ): Promise<SubmittableRange> {
    if (end_date < start_date) {
      throw unprocessable('end_date', 'end_date must be on or after start_date.');
    }
    if (start_date < this.today()) {
      throw unprocessable('start_date', 'Leave cannot start in the past.');
    }

    const rows = await this.schedules.findActiveForEmployee(employee_id);
    const workdays = new Set<number>(rows.map((r) => r.day_of_week));
    if (!workdays.has(weekdayOf(start_date))) {
      throw unprocessable('start_date', 'Start date is not a working day on your schedule.');
    }
    if (!workdays.has(weekdayOf(end_date))) {
      throw unprocessable('end_date', 'End date is not a working day on your schedule.');
    }

    if (day_portion !== DAY_PORTIONS.full) {
      if (start_date !== end_date) {
        throw unprocessable('day_portion', 'A half-day request must cover a single day.');
      }
      if (leave_type != null && !HALF_DAY_LEAVE_TYPES.has(leave_type)) {
        throw unprocessable('day_portion', `${leave_type} leave must be taken as a whole day.`);
      }
      // Non-null: the start-date workday check above guarantees a row.
      const row = rows.find((r) => r.day_of_week === weekdayOf(start_date)) as WorkScheduleRecord;
      const window = halfDayWindow(row, day_portion);
      return { working_days: 0.5, start_time: window.start_time, end_time: window.end_time };
    }

    return {
      working_days: countAgainst(workdays, start_date, end_date),
      start_time: null,
      end_time: null,
    };
  }
}

/**
 * Clock window of a half-day, derived from the schedule's break position.
 * Work W = (out − in) − break; each half charges 0.5 day and contains W/2
 * work-time. The split instant sits W/2 work after `expected_in`; if that
 * point falls after the break, the break duration is added back so the
 * wall-clock boundary lands correctly. Whichever side the break falls on
 * contains it. For 09:00–18:00 / break 12:00 / 60m: first half 09:00–14:00,
 * second half 14:00–18:00.
 */
function halfDayWindow(
  schedule: WorkScheduleRecord,
  portion: 'first_half' | 'second_half',
): { start_time: string; end_time: string } {
  const inSec = toSeconds(schedule.expected_in);
  const outSec = toSeconds(schedule.expected_out);
  const breakSec = schedule.break_minutes * 60;
  const halfWork = (outSec - inSec - breakSec) / 2;

  // Work-time elapsed before the break begins (Infinity when no break).
  const preBreak =
    schedule.break_start != null ? toSeconds(schedule.break_start) - inSec : Infinity;
  const splitSec = halfWork <= preBreak ? inSec + halfWork : inSec + halfWork + breakSec;

  return portion === DAY_PORTIONS.first_half
    ? { start_time: toClock(inSec), end_time: toClock(splitSec) }
    : { start_time: toClock(splitSec), end_time: toClock(outSec) };
}

/** Weekday (0=Sun..6=Sat) for a `YYYY-MM-DD` string, timezone-independent. */
function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function countAgainst(workdays: Set<number>, start_date: string, end_date: string): number {
  const end = Date.parse(`${end_date}T00:00:00Z`);
  let count = 0;
  for (let t = Date.parse(`${start_date}T00:00:00Z`); t <= end; t += MS_PER_DAY) {
    if (workdays.has(new Date(t).getUTCDay())) count += 1;
  }
  return count;
}
