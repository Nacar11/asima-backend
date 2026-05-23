import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsOptional, IsString, Matches, Min } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * Admin-only update payload. `employee_id` and `day_of_week` are
 * intentionally NOT writable — to move a schedule, end this row
 * (`effective_to=today`) and POST a new one.
 */
export class UpdateWorkScheduleDto {
  @ApiPropertyOptional({ example: '09:00:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'expected_in must be HH:MM or HH:MM:SS' })
  expected_in?: string;

  @ApiPropertyOptional({ example: '18:00:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'expected_out must be HH:MM or HH:MM:SS' })
  expected_out?: string;

  @ApiPropertyOptional({ example: 60, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  break_minutes?: number;

  @ApiPropertyOptional({ example: '2026-05-23' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effective_from must be YYYY-MM-DD' })
  effective_from?: string;

  @ApiPropertyOptional({ example: '2026-09-01', nullable: true })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effective_to must be YYYY-MM-DD' })
  effective_to?: string | null;
}
