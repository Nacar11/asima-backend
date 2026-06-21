import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompensationAuditAction } from '@/compensation/compensation.constants';

/**
 * One immutable audit row per write to a compensation record. Records the
 * before→after of the money + effective_from fields so an in-place salary
 * correction (which overwrites the row) still leaves a value-level trail —
 * the effective-dated history alone can't show what a correction changed.
 *
 * Append-only: there is no update/soft-delete of an audit row, so it carries
 * only `actor_id` (who) and `created_at` (when), not the usual
 * updated_by/deleted_by audit columns.
 *
 * Pure TS — `@nestjs/swagger` decorators are runtime-stripped.
 */
export class CompensationAudit {
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
