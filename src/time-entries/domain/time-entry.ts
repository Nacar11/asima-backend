import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimeEntrySource, TimeEntryStatus } from '@/time-entries/time-entries.constants';

/**
 * Time-entry domain class.
 *
 * Pure TS — no @nestjs/* runtime or typeorm imports. `@nestjs/swagger`
 * decorators are runtime-stripped, so they're allowed.
 *
 * One row per IN/OUT segment. The `period` column from `docs/schema.dbml`
 * was deliberately dropped in v0 (see Phase 6 plan, Q7); a future migration
 * can re-introduce it as a generated column from `time_in::time` if
 * reporting demands it.
 */
export class TimeEntry {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 12, description: 'FK to users.id (the employee, not the actor)' })
  employee_id: number;

  @ApiProperty({
    example: '2026-04-27',
    description: 'The calendar date this segment counts toward — handles overnight shifts',
  })
  work_date: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-04-27T09:00:00Z' })
  time_in: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'NULL while status=open (employee still clocked in)',
  })
  time_out: Date | null;

  @ApiProperty({
    enum: ['manual', 'biometric', 'admin'],
    example: 'manual',
    description: 'How this row was created — see TIME_ENTRY_SOURCES',
  })
  source: TimeEntrySource;

  @ApiProperty({
    enum: ['open', 'confirmed'],
    example: 'confirmed',
    description: 'Lifecycle — only one open row per employee is allowed (DB partial index)',
  })
  status: TimeEntryStatus;

  @ApiPropertyOptional({ example: 'Forgot to punch out at lunch', nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  created_by: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updated_by: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  deleted_by: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deleted_at: Date | null;
}
