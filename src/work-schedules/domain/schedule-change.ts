import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';
import { WorkSchedule } from '@/work-schedules/domain/work-schedule';

/**
 * Schedule-change domain types for the admin cascade flow (plan
 * `2026-06-20-admin-schedule-change-cascade.md`).
 *
 * A change to an existing weekly schedule is **forward-only**: the live row is
 * ended (or replaced) and a new row begins at `effective_from`. Dependent
 * time-correction and leave requests that the change invalidates are
 * auto-cancelled per the matrix in `cascade-policy.ts`.
 *
 * Pure TS — no `@nestjs/*` runtime / `typeorm` imports (`@nestjs/swagger`
 * decorators are runtime-stripped, so allowed).
 */

export type ScheduleChangeMode = 'modify' | 'remove';

/** What the admin wants to do to one (employee, weekday) effective `effective_from`. */
export interface ScheduleChangeIntent {
  employee_id: number;
  day_of_week: DayOfWeek;
  /** `X` — first date the change applies, `YYYY-MM-DD`, must be `>= today`. */
  effective_from: string;
  mode: ScheduleChangeMode;
  /** Window/break — required for `modify`, absent for `remove`. */
  expected_in?: string;
  expected_out?: string;
  break_minutes?: number;
  break_start?: string | null;
}

/**
 * How the live row is versioned. `replace`/`delete_only` cover the C1 same-day
 * edge: when the live row never took effect (`effective_from >= X`) it cannot be
 * ended at `X − 1` (would break the `effective_to >= effective_from` CHECK), so
 * it is soft-deleted instead.
 */
export type VersioningAction =
  | 'create' // no live row → just insert the new one (no cascade)
  | 'end_and_create' // end live at X−1, insert new at X
  | 'replace' // live un-started → soft-delete it, insert new at X
  | 'end_only' // remove: end live at X−1
  | 'delete_only' // remove + live un-started → soft-delete it
  | 'noop'; // remove with no live row → nothing to do

export type AffectedKind = 'leave' | 'time_correction';
export type TemporalClass = 'past' | 'present' | 'future';
export type CascadeDecision = 'cancel' | 'keep';

/**
 * A request the change touches. Only `decision === 'cancel'` rows land in the
 * impact lists. `trigger_dates` (I2) are the governed date(s) that caused the
 * cancel — so the UI can explain why a multi-day leave is in the list.
 */
export class AffectedRequest {
  @ApiProperty({ enum: ['leave', 'time_correction'] })
  kind!: AffectedKind;

  @ApiProperty({ example: 42 })
  id!: number;

  @ApiProperty({ example: 12 })
  employee_id!: number;

  @ApiProperty({ example: 'approved' })
  status!: string;

  @ApiProperty({ type: [String], example: ['2026-06-24', '2026-06-25'] })
  dates!: string[];

  @ApiProperty({ type: [String], example: ['2026-06-24'] })
  trigger_dates!: string[];

  @ApiProperty({ enum: ['past', 'present', 'future'] })
  temporal!: TemporalClass;

  @ApiProperty({ enum: ['cancel', 'keep'] })
  decision!: CascadeDecision;

  @ApiPropertyOptional({ example: 'vacation', nullable: true })
  leave_type!: string | null;

  @ApiPropertyOptional({
    example: 2,
    nullable: true,
    description: 'Working-days the request consumes (leave only) — drives freed_leave_days.',
  })
  working_days!: number | null;
}

/** The full dry-run report for a schedule change — returned by preview, echoed by apply. */
export class ScheduleChangeImpact {
  @ApiProperty({ enum: ['create', 'end_and_create', 'replace', 'end_only', 'delete_only', 'noop'] })
  versioning!: VersioningAction;

  @ApiPropertyOptional({
    example: 88,
    nullable: true,
    description: 'The live row that will be ended or replaced; null when creating fresh.',
  })
  live_row_id!: number | null;

  @ApiProperty({ type: [AffectedRequest] })
  affected_leaves!: AffectedRequest[];

  @ApiProperty({ type: [AffectedRequest] })
  affected_corrections!: AffectedRequest[];

  @ApiProperty({
    example: 2,
    description: 'Sum of working-days freed by cancelled leaves (derived balance returns them).',
  })
  freed_leave_days!: number;
}

/** Result of `apply` — what actually committed. Extends the impact with the new row. */
export class ScheduleChangeResult extends ScheduleChangeImpact {
  @ApiPropertyOptional({ type: WorkSchedule, nullable: true })
  created_row!: WorkSchedule | null;
}
