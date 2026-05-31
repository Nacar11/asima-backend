import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DecisionPath,
  LeaveRequestStatus,
  LeaveType,
} from '@/leave-requests/leave-requests.constants';

/**
 * Leave-request domain class.
 *
 * A submitted request is an **audit object** — see ADR 0001 and plan
 * §2.4. The requester cannot edit it after submission (only cancel +
 * resubmit); HR can edit a still-pending request under `LEAVE:Update`.
 *
 * `l1_approver_id` / `l2_approver_id` are a SNAPSHOT of the employee's
 * active approval chain at submit time, so the request resolves to the
 * approver who was assigned then even after the chain is reassigned.
 *
 * Pure TS — no `@nestjs/*` runtime or `typeorm` imports.
 */
export class LeaveRequest {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 12, description: 'FK to users.id — the requester' })
  employee_id!: number;

  @ApiProperty({ example: 'annual', enum: ['annual', 'sick', 'bereavement', 'unpaid', 'other'] })
  leave_type!: LeaveType;

  @ApiProperty({ example: '2026-06-01', description: 'YYYY-MM-DD, inclusive' })
  start_date!: string;

  @ApiProperty({ example: '2026-06-05', description: 'YYYY-MM-DD, inclusive (>= start_date)' })
  end_date!: string;

  @ApiPropertyOptional({ example: 'Family trip', nullable: true })
  reason!: string | null;

  @ApiProperty({
    example: 'pending_l1',
    enum: ['pending_l1', 'pending_l2', 'approved', 'rejected', 'cancelled'],
  })
  status!: LeaveRequestStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  submitted_at!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  decided_at!: Date | null;

  @ApiPropertyOptional({ example: 5, nullable: true, description: 'Who closed the request' })
  decided_by!: number | null;

  @ApiPropertyOptional({ example: null, nullable: true, description: 'Rejection reason, etc.' })
  decision_note!: string | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    enum: ['chain', 'override'],
    description: 'chain = assigned approver acted; override = ApproveAny/system_admin bypass',
  })
  decision_path!: DecisionPath | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  cancelled_at!: Date | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  cancelled_by!: number | null;

  @ApiProperty({ example: 5, description: 'Snapshot of the L1 approver at submit time (NOT NULL)' })
  l1_approver_id!: number;

  @ApiPropertyOptional({
    example: 7,
    nullable: true,
    description: 'Snapshot of the L2 approver; null = single-step chain (auto-approve after L1)',
  })
  l2_approver_id!: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  created_by!: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
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
