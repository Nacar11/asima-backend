import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * HR pending-only edit for `PATCH /admin/time-correction-requests/:id`.
 * The approver snapshot is not editable here.
 */
export class UpdateTimeCorrectionRequestDto {
  @ApiPropertyOptional({ example: '2026-06-10' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(DATE_REGEX, { message: 'work_date must be YYYY-MM-DD' })
  work_date?: string;

  @ApiPropertyOptional({ example: '2026-06-10T09:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  proposed_time_in?: Date;

  @ApiPropertyOptional({ example: '2026-06-10T18:00:00.000Z', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  proposed_time_out?: Date | null;

  @ApiPropertyOptional({ example: 'Updated reason', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason?: string;
}
