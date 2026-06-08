import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';

/**
 * Work-schedule domain class.
 *
 * One row = "this employee, on this day-of-week, is expected to work
 * <expected_in>..<expected_out> with <break_minutes> minutes of break,
 * effective from <effective_from> until <effective_to> (or open-ended
 * when effective_to is NULL)."
 *
 * The partial unique index
 *   (employee_id, day_of_week) WHERE effective_to IS NULL
 * enforces "at most one active row per (employee, weekday)". To change
 * a schedule, set `effective_to` on the current row, then insert a new
 * row with `effective_from = <new start>` — never UPDATE the active row
 * destructively, because historical DTRs need the schedule that was
 * active at the time.
 *
 * Pure TS — no `@nestjs/*` runtime or `typeorm` imports. `@nestjs/swagger`
 * decorators are runtime-stripped, so allowed.
 */
export class WorkSchedule {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 12, description: 'FK to users.id (the employee, not the actor)' })
  employee_id!: number;

  @ApiProperty({
    example: 1,
    minimum: 0,
    maximum: 6,
    description: '0 = Sunday … 6 = Saturday. DB CHECK enforces the range.',
  })
  day_of_week!: DayOfWeek;

  @ApiProperty({
    example: '09:00:00',
    description: 'Expected start of the work day, local time (HH:MM:SS).',
  })
  expected_in!: string;

  @ApiProperty({
    example: '18:00:00',
    description: 'Expected end of the work day, local time (HH:MM:SS).',
  })
  expected_out!: string;

  @ApiProperty({ example: 60, minimum: 0, description: 'Unpaid break length in minutes.' })
  break_minutes!: number;

  @ApiPropertyOptional({
    example: '12:00:00',
    nullable: true,
    description:
      'When the break begins, local time (HH:MM:SS). NULL when break_minutes = 0. ' +
      'Together with break_minutes it fixes the break window used for half-day leave.',
  })
  break_start!: string | null;

  @ApiProperty({
    example: '2026-05-23',
    description: 'First calendar date this schedule applies (inclusive, YYYY-MM-DD).',
  })
  effective_from!: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'NULL while active. Setting this is the "logical end" — see class docs.',
  })
  effective_to!: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  created_by!: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updated_by!: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  deleted_by!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deleted_at!: Date | null;
}
