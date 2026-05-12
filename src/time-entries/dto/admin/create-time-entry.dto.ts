import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { TIME_ENTRY_SOURCES, TimeEntrySource } from '@/time-entries/time-entries.constants';

const ALLOWED_SOURCES = Object.values(TIME_ENTRY_SOURCES) as TimeEntrySource[];

/**
 * Admin-only payload for `POST /admin/time-entries`. Carries the WIDE
 * field set — admins create or back-fill entries on behalf of any employee.
 *
 * Self-service users go through `POST /users/me/time-entries/punch`
 * (no DTO; toggle endpoint).
 */
export class CreateTimeEntryDto {
  @ApiProperty({ example: 12, description: 'Target employee (users.id) — NOT the actor.' })
  @IsInt()
  employee_id!: number;

  @ApiProperty({
    example: '2026-04-27',
    description: 'Calendar date the segment counts toward (YYYY-MM-DD).',
  })
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'work_date must be YYYY-MM-DD' })
  work_date!: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-04-27T09:00:00Z' })
  @Type(() => Date)
  @IsDate()
  time_in!: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Omit / null to create an open entry; provide to create a confirmed segment.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  time_out?: Date | null;

  @ApiPropertyOptional({
    enum: ALLOWED_SOURCES,
    default: TIME_ENTRY_SOURCES.admin,
    description: 'Defaults to "admin" — admins almost always create on behalf of someone.',
  })
  @IsOptional()
  @IsEnum(ALLOWED_SOURCES)
  source?: TimeEntrySource;

  @ApiPropertyOptional({ example: 'Forgot to punch out at lunch', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
