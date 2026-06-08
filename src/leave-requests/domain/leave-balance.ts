import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '@/leave-requests/leave-requests.constants';

/**
 * Per-type leave balance for one employee — a computed view, not a stored
 * row. `allowance` is `SUM(leave_allocations.amount)`; `used` and `reserved`
 * are `SUM(leave_requests.working_days)` over approved and pending requests
 * respectively (plan D1, reserve-on-submit). The service always returns one
 * of these per leave type, including types with no grants (allowance 0).
 */
export class LeaveBalance {
  @ApiProperty({
    example: 'vacation',
    enum: ['vacation', 'sick', 'bereavement', 'birthday', 'emergency'],
  })
  leave_type!: LeaveType;

  @ApiProperty({ example: 10, description: 'SUM of granted days (ledger)' })
  allowance!: number;

  @ApiProperty({ example: 3, description: 'Working days locked in by APPROVED requests' })
  used!: number;

  @ApiProperty({ example: 2, description: 'Working days held by PENDING requests' })
  reserved!: number;

  @ApiProperty({ example: 5, description: 'allowance − used − reserved (floored at 0)' })
  available!: number;
}
