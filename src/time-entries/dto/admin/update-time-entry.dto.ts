import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { TIME_ENTRY_SOURCES, TimeEntrySource } from '@/time-entries/time-entries.constants';

const ALLOWED_SOURCES = Object.values(TIME_ENTRY_SOURCES) as TimeEntrySource[];

/**
 * Admin-only patch DTO. `status` is intentionally absent — it's derived
 * by the service from `time_out` (null = open, set = confirmed). This
 * keeps the lifecycle invariant in one place.
 *
 * `employee_id` is also intentionally absent — moving an entry between
 * employees is not a supported operation. Soft-delete and re-create
 * instead.
 */
export class UpdateTimeEntryDto {
  @ApiPropertyOptional({ example: '2026-04-27' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'work_date must be YYYY-MM-DD' })
  work_date?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  time_in?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  time_out?: Date | null;

  @ApiPropertyOptional({ enum: ALLOWED_SOURCES })
  @IsOptional()
  @IsEnum(ALLOWED_SOURCES)
  source?: TimeEntrySource;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
