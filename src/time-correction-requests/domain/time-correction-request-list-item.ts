import { ApiPropertyOptional } from '@nestjs/swagger';
import { TimeCorrectionRequest } from '@/time-correction-requests/domain/time-correction-request';

/**
 * List read-model: a time-correction request plus the requester's display
 * name, resolved by a join at query time. Kept separate from the
 * `TimeCorrectionRequest` audit entity (which stays a pure persisted
 * record) — same split as `LeaveRequestListItem` and `EmployeeChainView`.
 */
export class TimeCorrectionRequestListItem extends TimeCorrectionRequest {
  @ApiPropertyOptional({ example: 'Ada Lovelace', nullable: true })
  employee_name!: string | null;

  @ApiPropertyOptional({ example: 'Jane Cruz', nullable: true })
  l1_approver_name!: string | null;

  @ApiPropertyOptional({ example: 'Bob Lim', nullable: true })
  l2_approver_name!: string | null;
}
