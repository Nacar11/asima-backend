import { DayOfWeek } from '@/work-schedules/work-schedules.constants';

/**
 * Work-schedule domain **record** — the persisted shape, as pure data. It is the
 * reconstitution input for the `WorkSchedule` aggregate and the read shape the
 * assembler serializes.
 *
 * One row = "this employee, on this day-of-week, is expected to work
 * <expected_in>..<expected_out> with <break_minutes> minutes of break,
 * effective from <effective_from> until <effective_to> (or open-ended when
 * effective_to is NULL)."
 *
 * The partial unique index `(employee_id, day_of_week) WHERE effective_to IS
 * NULL` enforces "at most one active row per (employee, weekday)". To change a
 * schedule, set `effective_to` on the current row, then insert a new row with
 * `effective_from = <new start>` — never UPDATE the active row destructively,
 * because historical DTRs need the schedule that was active at the time.
 *
 * Pure TS — no `@nestjs/*` (not even `@ApiProperty`), no `typeorm`. The
 * Swagger/HTTP shape lives in `dto/response/work-schedule-response.dto.ts`; the
 * lifecycle behavior on `domain/work-schedule.aggregate.ts`. Field order mirrors
 * `mapper.toDomain` (which drives JSON key order — keep them in sync).
 */
export class WorkScheduleRecord {
  id!: number;

  /** FK to users.id (the employee, not the actor). */
  employee_id!: number;

  /** 0 = Sunday … 6 = Saturday. DB CHECK enforces the range. */
  day_of_week!: DayOfWeek;

  /** Expected start of the work day, local time (HH:MM:SS). */
  expected_in!: string;

  /** Expected end of the work day, local time (HH:MM:SS). */
  expected_out!: string;

  /** Unpaid break length in minutes. */
  break_minutes!: number;

  /**
   * When the break begins, local time (HH:MM:SS). NULL when break_minutes = 0.
   * Together with break_minutes it fixes the break window used for half-day leave.
   */
  break_start!: string | null;

  /** First calendar date this schedule applies (inclusive, YYYY-MM-DD). */
  effective_from!: string;

  /** NULL while active. Setting this is the "logical end". */
  effective_to!: string | null;

  created_by!: number | null;

  updated_by!: number | null;

  deleted_by!: number | null;

  created_at!: Date;

  updated_at!: Date;

  deleted_at!: Date | null;
}
