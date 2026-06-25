import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DayPortion,
  DecisionPath,
  LeaveRequestStatus,
  LeaveType,
} from '@/leave-requests/leave-requests.constants';

/**
 * HTTP response shape for a leave request. This is the wire contract — it
 * carries the `@ApiProperty` Swagger metadata that used to live on the
 * domain class, keeping the domain pure (no `@nestjs/*`). Field names and
 * order mirror the persisted record exactly (snake_case end-to-end), so the
 * JSON is identical to the pre-DDD response.
 */
export class LeaveRequestResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 12, description: 'FK to users.id — the requester' })
  employee_id!: number;

  @ApiProperty({
    example: 'vacation',
    enum: ['vacation', 'sick', 'bereavement', 'birthday', 'emergency'],
  })
  leave_type!: LeaveType;

  @ApiProperty({ example: '2026-06-01', description: 'YYYY-MM-DD, inclusive' })
  start_date!: string;

  @ApiProperty({ example: '2026-06-05', description: 'YYYY-MM-DD, inclusive (>= start_date)' })
  end_date!: string;

  @ApiProperty({
    example: 2,
    description:
      'Scheduled working days in [start_date, end_date] — snapshot at submit time. ' +
      '0.5 for a half-day request.',
  })
  working_days!: number;

  @ApiProperty({
    example: 'full',
    enum: ['full', 'first_half', 'second_half'],
    description: 'Which slice of the day. first/second_half charge 0.5 and are single-day only.',
  })
  day_portion!: DayPortion;

  @ApiPropertyOptional({
    example: '09:00:00',
    nullable: true,
    description: 'Half-day window start (HH:MM:SS), snapshot from the schedule. NULL for full day.',
  })
  start_time!: string | null;

  @ApiPropertyOptional({
    example: '14:00:00',
    nullable: true,
    description: 'Half-day window end (HH:MM:SS). NULL for full day.',
  })
  end_time!: string | null;

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

  @ApiPropertyOptional({
    example: 3,
    nullable: true,
    description: 'FK attachments.id — the mandatory file for sick/bereavement; null otherwise',
  })
  attachment_id!: number | null;

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
