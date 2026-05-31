import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { BaseWorkScheduleRepository } from '@/work-schedules/persistence/base-work-schedule.repository';

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
   * D8: validate a requested range and return its working-day count.
   * Throws 422 (per-field) on: end before start, start in the past, or a
   * non-workday start/end boundary. Reused by submit and the preview endpoint.
   */
  async assertSubmittableRange(
    employee_id: number,
    start_date: string,
    end_date: string,
  ): Promise<number> {
    if (end_date < start_date) {
      throw unprocessable('end_date', 'end_date must be on or after start_date.');
    }
    if (start_date < this.today()) {
      throw unprocessable('start_date', 'Leave cannot start in the past.');
    }
    const workdays = await this.activeWeekdays(employee_id);
    if (!workdays.has(weekdayOf(start_date))) {
      throw unprocessable('start_date', 'Start date is not a working day on your schedule.');
    }
    if (!workdays.has(weekdayOf(end_date))) {
      throw unprocessable('end_date', 'End date is not a working day on your schedule.');
    }
    return countAgainst(workdays, start_date, end_date);
  }
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

function unprocessable(field: string, message: string): UnprocessableEntityException {
  return new UnprocessableEntityException({ status: 422, errors: { [field]: message } });
}
