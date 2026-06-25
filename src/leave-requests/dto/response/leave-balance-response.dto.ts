import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '@/leave-requests/leave-requests.constants';

/**
 * HTTP response shape for a per-type leave balance (a computed view, not a
 * stored row). Carries the Swagger metadata so the `LeaveBalance` read-model
 * stays pure. Shared by the leave-requests and leave-allocations surfaces.
 */
export class LeaveBalanceResponseDto {
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
