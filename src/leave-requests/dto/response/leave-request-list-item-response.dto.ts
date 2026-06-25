import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveRequestResponseDto } from '@/leave-requests/dto/response/leave-request-response.dto';

/**
 * List-row response: a leave request plus the display names resolved by a
 * join at query time (the HR table renders them without a second round-trip).
 * Mirrors the old `LeaveRequestListItem` wire shape.
 */
export class LeaveRequestListItemResponseDto extends LeaveRequestResponseDto {
  @ApiPropertyOptional({ example: 'Ada Lovelace', nullable: true })
  employee_name!: string | null;

  @ApiPropertyOptional({ example: 'Grace Hopper', nullable: true })
  l1_approver_name!: string | null;

  @ApiPropertyOptional({ example: 'Alan Turing', nullable: true })
  l2_approver_name!: string | null;

  @ApiPropertyOptional({ example: 'Edsger Dijkstra', nullable: true })
  decided_by_name!: string | null;
}
