import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TIME_ENTRY_SOURCES,
  TimeEntrySource,
  TimeEntryStatus,
} from '@/time-entries/time-entries.constants';

/**
 * HTTP response shape for a time entry. This is the wire contract — it carries
 * the `@ApiProperty` Swagger metadata that used to live on the domain class,
 * keeping the domain pure (no `@nestjs/*`). Field names + order mirror the
 * persisted record exactly (snake_case end-to-end), so the JSON is identical to
 * the pre-DDD response. The e2e suite guards byte-for-byte parity.
 *
 * The `source` enum is derived from `TIME_ENTRY_SOURCES` (single source of
 * truth) so it can't drift from the entity/DB type — the old hand-written
 * literal omitted `'correction'`, mistyping a value the API actually returns.
 */
export class TimeEntryResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 12, description: 'FK to users.id (the employee, not the actor)' })
  employee_id!: number;

  @ApiProperty({
    example: '2026-04-27',
    description: 'The calendar date this segment counts toward — handles overnight shifts',
  })
  work_date!: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-04-27T09:00:00Z' })
  time_in!: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'NULL while status=open (employee still clocked in)',
  })
  time_out!: Date | null;

  @ApiProperty({
    enum: Object.values(TIME_ENTRY_SOURCES),
    example: 'manual',
    description: 'How this row was created — see TIME_ENTRY_SOURCES',
  })
  source!: TimeEntrySource;

  @ApiProperty({
    enum: ['open', 'confirmed'],
    example: 'confirmed',
    description: 'Lifecycle — only one open row per employee is allowed (DB partial index)',
  })
  status!: TimeEntryStatus;

  @ApiPropertyOptional({ example: 'Forgot to punch out at lunch', nullable: true })
  notes!: string | null;

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
