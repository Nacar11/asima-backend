import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LEAVE_TYPES, LeaveType } from '@/leave-requests/leave-requests.constants';
import {
  ALLOCATION_SOURCES,
  AllocationSource,
} from '@/leave-allocations/leave-allocations.constants';

/**
 * HTTP/Swagger response shape for one grant-ledger row. The `@ApiProperty`
 * wire contract lives here so the `LeaveAllocationRecord` domain class stays
 * pure. Field names + order mirror the persisted record (snake_case
 * end-to-end), so the JSON is byte-identical to the pre-DDD response.
 */
export class LeaveAllocationResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 12, description: 'FK to users.id — the employee granted the days' })
  employee_id!: number;

  @ApiProperty({ example: 'vacation', enum: Object.values(LEAVE_TYPES) })
  leave_type!: LeaveType;

  @ApiProperty({ example: 10, description: 'Days granted by this row (> 0)' })
  amount!: number;

  @ApiProperty({ example: 'default', enum: Object.values(ALLOCATION_SOURCES) })
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
