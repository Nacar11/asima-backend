import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Approval-chain domain class — one versioned approver assignment.
 *
 * One row = "for employee `employee_id`, at `step` (1 = first approver,
 * 2 = second), `approver_id` can act, effective from `effective_at`
 * until `ended_at` (NULL = currently active)".
 *
 * See ADR 0001 (role-vs-chain split) and the 2026-05-30 plan §3.1.
 * Reassignment is logical-end + insert — the old row is never UPDATEd
 * destructively, so a leave/correction request that snapshotted the
 * approver at submit time still resolves to the approver active then.
 *
 * Pure TS — no `@nestjs/*` runtime or `typeorm` imports. `@nestjs/swagger`
 * decorators are runtime-stripped, so allowed.
 */
export class ApprovalChain {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({
    example: 12,
    description: 'FK to users.id — the employee whose request is routed',
  })
  employee_id!: number;

  @ApiProperty({ example: 1, minimum: 1, description: '1 = first approver, 2 = second, …' })
  step!: number;

  @ApiProperty({ example: 5, description: 'FK to users.id — who can approve at this step' })
  approver_id!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  effective_at!: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'NULL while active. Stamped on reassignment (logical end).',
  })
  ended_at!: Date | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  created_by!: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updated_by!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;
}
