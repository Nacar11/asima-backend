import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Self-service submit payload for `POST /users/me/time-correction-requests`.
 *
 * `employee_id` is NOT a field — derived from the JWT. `target_entry_id`
 * is omitted/null for a missed-punch (no existing row to correct).
 */
export class SubmitTimeCorrectionRequestDto {
  @ApiPropertyOptional({
    example: 88,
    nullable: true,
    description: 'time_entries.id to correct; omit/null for a missed-punch',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  target_entry_id?: number | null;

  @ApiProperty({ example: '2026-06-10', description: 'Work date being corrected (YYYY-MM-DD)' })
  @IsISO8601({ strict: true })
  @Matches(DATE_REGEX, { message: 'work_date must be YYYY-MM-DD' })
  work_date!: string;

  @ApiProperty({ example: '2026-06-10T09:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  proposed_time_in!: Date;

  @ApiPropertyOptional({ example: '2026-06-10T18:00:00.000Z', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  proposed_time_out?: Date | null;

  @ApiProperty({ example: 'Forgot to clock in', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}
