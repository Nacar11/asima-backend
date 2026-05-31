import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { LEAVE_TYPES, LeaveType } from '@/leave-requests/leave-requests.constants';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Self-service submit payload for `POST /users/me/leave-requests`.
 *
 * Narrow by design (CLAUDE.md "Admin vs. self-service"): `employee_id`
 * is NOT a field — the server derives it from the JWT. Status, approver
 * snapshot, and decision fields are server-owned and absent here.
 */
export class SubmitLeaveRequestDto {
  @ApiProperty({ example: 'annual', enum: Object.values(LEAVE_TYPES) })
  @IsIn(Object.values(LEAVE_TYPES))
  leave_type!: LeaveType;

  @ApiProperty({ example: '2026-06-01', description: 'YYYY-MM-DD, inclusive' })
  @IsISO8601({ strict: true })
  @Matches(DATE_REGEX, { message: 'start_date must be YYYY-MM-DD' })
  start_date!: string;

  @ApiProperty({ example: '2026-06-05', description: 'YYYY-MM-DD, inclusive (>= start_date)' })
  @IsISO8601({ strict: true })
  @Matches(DATE_REGEX, { message: 'end_date must be YYYY-MM-DD' })
  end_date!: string;

  @ApiPropertyOptional({ example: 'Family trip', maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
}
