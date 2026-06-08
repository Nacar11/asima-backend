import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import {
  DAY_PORTIONS,
  DayPortion,
  LEAVE_TYPES,
  LeaveType,
} from '@/leave-requests/leave-requests.constants';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * HR pending-only edit for `PATCH /admin/leave-requests/:id` (Q3). The
 * approver snapshot is NOT editable here — to re-route, use
 * `/admin/approvers/repair-pending`. Credentials/decision fields are
 * server-owned and absent.
 */
export class UpdateLeaveRequestDto {
  @ApiPropertyOptional({ example: 'sick', enum: Object.values(LEAVE_TYPES) })
  @IsOptional()
  @IsIn(Object.values(LEAVE_TYPES))
  leave_type?: LeaveType;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(DATE_REGEX, { message: 'start_date must be YYYY-MM-DD' })
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-06-05' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(DATE_REGEX, { message: 'end_date must be YYYY-MM-DD' })
  end_date?: string;

  @ApiPropertyOptional({ example: 'full', enum: Object.values(DAY_PORTIONS) })
  @IsOptional()
  @IsIn(Object.values(DAY_PORTIONS))
  day_portion?: DayPortion;

  @ApiPropertyOptional({ example: 'Updated reason', maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
}
