import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AffectedKind,
  CascadeDecision,
  TemporalClass,
  VersioningAction,
} from '@/work-schedules/domain/schedule-change';
import { WorkScheduleResponseDto } from '@/work-schedules/dto/response/work-schedule-response.dto';

/**
 * HTTP response shapes for the schedule-change cascade. These carry the
 * `@ApiProperty` Swagger metadata that used to live on the `domain/
 * schedule-change.ts` classes, keeping the domain pure. Field names + order
 * mirror the domain read-models exactly, so the JSON is byte-identical to the
 * pre-DDD response. The cascade service returns the domain types; the
 * controller assembles them into these DTOs.
 */
export class AffectedRequestResponseDto {
  @ApiProperty({ enum: ['leave', 'time_correction'] })
  kind!: AffectedKind;

  @ApiProperty({ example: 42 })
  id!: number;

  @ApiProperty({ example: 12 })
  employee_id!: number;

  @ApiProperty({ example: 'approved' })
  status!: string;

  @ApiProperty({ type: [String], example: ['2026-06-24', '2026-06-25'] })
  dates!: string[];

  @ApiProperty({ type: [String], example: ['2026-06-24'] })
  trigger_dates!: string[];

  @ApiProperty({ enum: ['past', 'present', 'future'] })
  temporal!: TemporalClass;

  @ApiProperty({ enum: ['cancel', 'keep'] })
  decision!: CascadeDecision;

  @ApiPropertyOptional({ example: 'vacation', nullable: true })
  leave_type!: string | null;

  @ApiPropertyOptional({
    example: 2,
    nullable: true,
    description: 'Working-days the request consumes (leave only) — drives freed_leave_days.',
  })
  working_days!: number | null;
}

export class ScheduleChangeImpactResponseDto {
  @ApiProperty({ enum: ['create', 'end_and_create', 'replace', 'end_only', 'delete_only', 'noop'] })
  versioning!: VersioningAction;

  @ApiPropertyOptional({
    example: 88,
    nullable: true,
    description: 'The live row that will be ended or replaced; null when creating fresh.',
  })
  live_row_id!: number | null;

  @ApiProperty({ type: [AffectedRequestResponseDto] })
  affected_leaves!: AffectedRequestResponseDto[];

  @ApiProperty({ type: [AffectedRequestResponseDto] })
  affected_corrections!: AffectedRequestResponseDto[];

  @ApiProperty({
    example: 2,
    description: 'Sum of working-days freed by cancelled leaves (derived balance returns them).',
  })
  freed_leave_days!: number;
}

export class ScheduleChangeResultResponseDto extends ScheduleChangeImpactResponseDto {
  @ApiPropertyOptional({ type: WorkScheduleResponseDto, nullable: true })
  created_row!: WorkScheduleResponseDto | null;
}
