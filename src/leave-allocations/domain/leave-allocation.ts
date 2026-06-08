import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType } from '@/leave-requests/leave-requests.constants';
import { AllocationSource } from '@/leave-allocations/leave-allocations.constants';

/**
 * Leave-allocation domain class — one immutable row in the grant ledger.
 *
 * `allowance(employee, type) = SUM(amount)` over non-deleted rows. Default
 * 10/10 land as `source='default'` rows; admin grants append `source=
 * 'admin_grant'`. Append-only: there is no update path, and `amount > 0`
 * (revocation = soft-delete a row, plan D7).
 *
 * Pure TS — `@nestjs/swagger` decorators are runtime-stripped, so allowed.
 */
export class LeaveAllocation {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 12, description: 'FK to users.id — the employee granted the days' })
  employee_id!: number;

  @ApiProperty({
    example: 'vacation',
    enum: ['vacation', 'sick', 'bereavement', 'birthday', 'emergency'],
  })
  leave_type!: LeaveType;

  @ApiProperty({ example: 10, description: 'Days granted by this row (> 0)' })
  amount!: number;

  @ApiProperty({ example: 'default', enum: ['default', 'admin_grant'] })
  source!: AllocationSource;

  @ApiPropertyOptional({ example: 'Annual entitlement', nullable: true })
  reason!: string | null;

  @ApiPropertyOptional({
    example: 5,
    nullable: true,
    description: 'users.id of the admin who granted this (null for system defaults)',
  })
  granted_by!: number | null;

  @ApiPropertyOptional({ example: 5, nullable: true })
  created_by!: number | null;

  @ApiPropertyOptional({ example: 5, nullable: true })
  updated_by!: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  deleted_by!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deleted_at!: Date | null;
}
