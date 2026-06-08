import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { LEAVE_TYPES, LeaveType } from '@/leave-requests/leave-requests.constants';

/**
 * Admin grant payload for `POST /admin/users/:id/leave-allocations`.
 *
 * Append-only: this adds `amount` days to the employee's allowance for the
 * given type. `amount` is bounded `[1, 365]` — grants only add (plan D7), and
 * the upper bound stops a fat-fingered five-figure grant.
 */
export class GrantLeaveAllocationDto {
  @ApiProperty({ example: 'vacation', enum: Object.values(LEAVE_TYPES) })
  @IsIn(Object.values(LEAVE_TYPES))
  leave_type!: LeaveType;

  @ApiProperty({ example: 5, minimum: 1, maximum: 365, description: 'Days to grant (> 0)' })
  @IsInt()
  @Min(1)
  @Max(365)
  amount!: number;

  @ApiPropertyOptional({ example: 'Tenure bonus', maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
}
