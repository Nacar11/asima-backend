import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, Matches } from 'class-validator';
import {
  DAY_PORTIONS,
  DayPortion,
  LEAVE_TYPES,
  LeaveType,
} from '@/leave-requests/leave-requests.constants';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Query for `GET /users/me/leave-requests/day-count`. */
export class DayCountQueryDto {
  @ApiProperty({ example: '2026-06-01', description: 'YYYY-MM-DD, inclusive' })
  @IsISO8601({ strict: true })
  @Matches(DATE_REGEX, { message: 'start_date must be YYYY-MM-DD' })
  start_date!: string;

  @ApiProperty({ example: '2026-06-05', description: 'YYYY-MM-DD, inclusive (>= start_date)' })
  @IsISO8601({ strict: true })
  @Matches(DATE_REGEX, { message: 'end_date must be YYYY-MM-DD' })
  end_date!: string;

  @ApiPropertyOptional({
    example: 'first_half',
    enum: Object.values(DAY_PORTIONS),
    description: 'Defaults to full. first/second_half preview a 0.5-day request + its window.',
  })
  @IsOptional()
  @IsIn(Object.values(DAY_PORTIONS))
  day_portion?: DayPortion;

  @ApiPropertyOptional({
    example: 'vacation',
    enum: Object.values(LEAVE_TYPES),
    description: 'Required to validate half-day eligibility (birthday is whole-day only).',
  })
  @IsOptional()
  @IsIn(Object.values(LEAVE_TYPES))
  leave_type?: LeaveType;
}
