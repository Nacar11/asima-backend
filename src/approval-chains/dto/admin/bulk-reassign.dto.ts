import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

/**
 * Payload for `POST /admin/approvers/bulk-reassign`.
 *
 * "Wherever `from_approver_id` is an active approver, replace with
 * `to_approver_id`." Rows where the employee IS `to_approver_id` are
 * skipped (self-approval guard) and reported back in the response.
 */
export class BulkReassignDto {
  @ApiProperty({ example: 5, description: 'The approver being replaced (users.id).' })
  @IsInt()
  @Min(1)
  from_approver_id!: number;

  @ApiProperty({ example: 8, description: 'The replacement approver (users.id).' })
  @IsInt()
  @Min(1)
  to_approver_id!: number;
}
