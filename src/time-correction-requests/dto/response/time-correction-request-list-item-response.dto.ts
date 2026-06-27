import { ApiPropertyOptional } from '@nestjs/swagger';
import { TimeCorrectionRequestResponseDto } from '@/time-correction-requests/dto/response/time-correction-request-response.dto';

/**
 * List-row response: a time-correction request plus the display names resolved
 * by a join at query time (the HR table renders them without a second round-
 * trip). Mirrors the old `TimeCorrectionRequestListItem` wire shape.
 */
export class TimeCorrectionRequestListItemResponseDto extends TimeCorrectionRequestResponseDto {
  @ApiPropertyOptional({ example: 'Ada Lovelace', nullable: true })
  employee_name!: string | null;

  @ApiPropertyOptional({ example: 'Jane Cruz', nullable: true })
  l1_approver_name!: string | null;

  @ApiPropertyOptional({ example: 'Bob Lim', nullable: true })
  l2_approver_name!: string | null;
}
