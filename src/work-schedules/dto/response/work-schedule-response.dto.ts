import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';

/**
 * HTTP response shape for a work schedule. This is the wire contract — it
 * carries the `@ApiProperty` Swagger metadata that used to live on the domain
 * class, keeping the domain pure (no `@nestjs/*`). Field names + order mirror
 * the persisted record exactly (snake_case end-to-end), so the JSON is
 * identical to the pre-DDD response. The e2e suite guards byte-for-byte parity.
 */
export class WorkScheduleResponseDto {
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
