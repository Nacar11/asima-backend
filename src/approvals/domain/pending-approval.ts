import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Time-correction-specific payload on a pending approval row. Present only
 * when `kind === 'time_correction'`; lets the inbox render the original→
 * proposed in/out diff without a second round-trip. Times are raw ISO so the
 * frontend formats them in the display timezone (one render path).
 */
export class PendingApprovalTimeCorrection {
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  original_time_in!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  original_time_out!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  proposed_time_in!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  proposed_time_out!: Date | null;

  @ApiProperty({ example: false, description: 'true = new manual log (no target entry)' })
  is_new_log!: boolean;
}

/**
 * Discriminator for the kind of request a pending approval refers to.
 * `leave` and `time_correction` are the planned consumers; both land
 * with their respective modules. See spec
 * `docs/plans/2026-05-25-approvals-page-and-role-sidebar.md` §4.2.
 */
export type PendingApprovalKind = 'leave' | 'time_correction';

/**
 * Pending approval domain class — a row in the cross-resource approvals
 * inbox.
 *
 * v0 ships this shape so the frontend can write its zod schema today;
 * the backend never populates a row yet because `approval_chains` and
 * `leave_requests` don't exist. When those land, the query in
 * `ApprovalsService.findPending` joins them and populates this shape.
 *
 * `kind` is the discriminator the frontend uses to deep-link into the
 * right detail route once those land. Reserving the field now avoids
 * a breaking change later.
 */
export class PendingApproval {
  @ApiProperty({ example: 42 })
  id!: number;

  @ApiProperty({ example: 'leave', enum: ['leave', 'time_correction'] })
  kind!: PendingApprovalKind;

  @ApiProperty({ example: 7 })
  employee_id!: number;

  @ApiProperty({ example: 'Jane Smith' })
  employee_name!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  requested_at!: Date;

  @ApiProperty({ example: 1 })
  current_step!: number;

  @ApiProperty({ example: 12 })
  current_approver_id!: number;

  @ApiProperty({
    example: 'Danielle Aguilar',
    description: 'Display name of the current-step approver (or "User #<id>" if unresolved).',
  })
  current_approver_name!: string;

  @ApiProperty({ example: 'Vacation leave, 2026-06-01 to 2026-06-05' })
  summary!: string;

  @ApiPropertyOptional({ type: () => PendingApprovalTimeCorrection, nullable: true })
  time_correction?: PendingApprovalTimeCorrection | null;
}
