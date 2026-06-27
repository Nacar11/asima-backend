import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TcDecisionPath,
  TimeCorrectionStatus,
} from '@/time-correction-requests/time-correction-requests.constants';

/**
 * HTTP response shape for a time-correction request. This is the wire contract
 * — it carries the `@ApiProperty` Swagger metadata that used to live on the
 * domain class, keeping the domain pure (no `@nestjs/*`). Field names + order
 * mirror the persisted record exactly (snake_case end-to-end), so the JSON is
 * identical to the pre-DDD response.
 */
export class TimeCorrectionRequestResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 12, description: 'FK to users.id — the requester' })
  employee_id!: number;

  @ApiPropertyOptional({
    example: 88,
    nullable: true,
    description: 'FK to time_entries.id; NULL = missed-punch (no row to correct)',
  })
  target_entry_id!: number | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description:
      "The target entry's current time_in, resolved by join. NULL when no " +
      'target entry (new log) or the join was not loaded. Lets the UI render ' +
      'the original→proposed diff.',
  })
  original_time_in!: Date | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: "The target entry's current time_out, resolved by join. NULL otherwise.",
  })
  original_time_out!: Date | null;

  @ApiProperty({ example: '2026-06-10', description: 'Work date being corrected (YYYY-MM-DD)' })
  work_date!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  proposed_time_in!: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'NULL = open segment (no time_out)',
  })
  proposed_time_out!: Date | null;

  @ApiProperty({ example: 'Forgot to clock in', maxLength: 500 })
  reason!: string;

  @ApiProperty({
    example: 'pending_l1',
    enum: ['pending_l1', 'pending_l2', 'approved', 'rejected', 'cancelled'],
  })
  status!: TimeCorrectionStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  submitted_at!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  decided_at!: Date | null;

  @ApiPropertyOptional({ example: 5, nullable: true })
  decided_by!: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  decision_note!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, enum: ['chain', 'override'] })
  decision_path!: TcDecisionPath | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  cancelled_at!: Date | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  cancelled_by!: number | null;

  @ApiProperty({ example: 5, description: 'Snapshot of the L1 approver at submit (NOT NULL)' })
  l1_approver_id!: number;

  @ApiPropertyOptional({ example: 7, nullable: true })
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
