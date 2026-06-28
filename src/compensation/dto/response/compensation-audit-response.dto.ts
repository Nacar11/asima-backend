import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompensationAuditAction } from '@/compensation/compensation.constants';

/**
 * HTTP response shape for one compensation audit row. The wire contract — it
 * carries the `@ApiProperty` Swagger metadata that used to live on the domain
 * record, keeping the domain pure. Field names + order mirror the persisted
 * audit record exactly, so the JSON is identical to the pre-DDD response. The
 * e2e suite guards byte-for-byte parity.
 */
export class CompensationAuditResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 7, description: 'FK to employee_compensations.id' })
  compensation_id!: number;

  @ApiProperty({ example: 12, description: 'FK to users.id (the employee), denormalized' })
  employee_id!: number;

  @ApiProperty({ example: 'updated', enum: ['created', 'updated', 'deleted'] })
  action!: CompensationAuditAction;

  @ApiPropertyOptional({ example: 50000, nullable: true, description: 'null on a create' })
  before_monthly_salary!: number | null;

  @ApiPropertyOptional({ example: 55000, nullable: true, description: 'null on a delete' })
  after_monthly_salary!: number | null;

  @ApiPropertyOptional({ example: 239.6128, nullable: true })
  before_hourly_rate!: number | null;

  @ApiPropertyOptional({ example: 263.5741, nullable: true })
  after_hourly_rate!: number | null;

  @ApiPropertyOptional({ example: '2026-01-01', nullable: true })
  before_effective_from!: string | null;

  @ApiPropertyOptional({ example: '2026-06-01', nullable: true })
  after_effective_from!: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true, description: 'users.id of the actor' })
  actor_id!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;
}
