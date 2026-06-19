import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * Body for the cascade-aware schedule-change flow
 * (`POST /admin/work-schedules/changes/preview` and `…/changes`).
 *
 * Window fields are optional here — they are required for `mode: 'modify'` and
 * forbidden semantics for `'remove'` are enforced in `ScheduleChangeService`
 * (cross-field rules the DTO can't express cleanly). `effective_from` must be
 * today or later (forward-only); that bound is also checked in the service.
 */
export class ScheduleChangeDto {
  @ApiProperty({ example: 12, description: 'Target employee (users.id) — NOT the actor.' })
  @IsInt()
  employee_id!: number;

  @ApiProperty({ example: 1, minimum: 0, maximum: 6, description: '0 = Sunday … 6 = Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week!: number;

  @ApiProperty({ example: '2026-06-24', description: 'YYYY-MM-DD, must be today or later' })
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effective_from must be YYYY-MM-DD' })
  effective_from!: string;

  @ApiProperty({ enum: ['modify', 'remove'], example: 'modify' })
  @IsIn(['modify', 'remove'])
  mode!: 'modify' | 'remove';

  @ApiPropertyOptional({
    example: '09:00:00',
    description: 'Required for modify. HH:MM or HH:MM:SS',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'expected_in must be HH:MM or HH:MM:SS' })
  expected_in?: string;

  @ApiPropertyOptional({
    example: '18:00:00',
    description: 'Required for modify. HH:MM or HH:MM:SS',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'expected_out must be HH:MM or HH:MM:SS' })
  expected_out?: string;

  @ApiPropertyOptional({ example: 60, minimum: 0, description: 'Required for modify.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  break_minutes?: number;

  @ApiPropertyOptional({
    example: '12:00:00',
    nullable: true,
    description: 'Break start (HH:MM or HH:MM:SS). Required when break_minutes > 0.',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'break_start must be HH:MM or HH:MM:SS' })
  break_start?: string | null;
}
