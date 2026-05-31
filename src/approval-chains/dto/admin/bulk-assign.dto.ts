import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, Min } from 'class-validator';

/**
 * Payload for `POST /admin/approvers/bulk-assign`.
 *
 * "Assign this approver to these employees." The inverse of
 * `BulkReassignDto` (which pivots on an existing approver) — here the
 * source is an explicit list of `employee_ids`, which is what the common
 * case needs: most employees start with no approver, so there is nothing
 * to reassign *from*.
 *
 * `l1_approver_id` is REQUIRED — every selected employee gets an L1, which
 * makes the "L2 without L1" state structurally impossible. `l2_approver_id`
 * is optional (omit = leave L2 untouched). No `null`/clear in bulk for v1;
 * assigning a step OVERWRITES any existing approver at that step. Employees
 * who would become their own approver are skipped server-side and reported.
 */
export class BulkAssignDto {
  @ApiProperty({
    type: [Number],
    example: [12, 13, 14],
    description: 'Employees to assign (users.id).',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  employee_ids!: number[];

  @ApiProperty({
    example: 5,
    description: 'Level 1 approver (users.id). Required — set on every selected employee.',
  })
  @IsInt()
  @Min(1)
  l1_approver_id!: number;

  @ApiPropertyOptional({
    example: 7,
    description: 'Level 2 approver (users.id). Optional; omit to leave L2 untouched.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  l2_approver_id?: number;
}
