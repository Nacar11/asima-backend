import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, Matches } from 'class-validator';

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
}
