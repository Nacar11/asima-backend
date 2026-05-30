import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Payload for `PATCH /admin/approvers/:employee_id` — the Edit-User
 * drawer and per-row inline edit both target this.
 *
 * Tri-state per field (see service `setChain`):
 *   - omitted  → leave that step unchanged
 *   - `null`   → clear (logically end) that step
 *   - number   → set that step to the given approver
 *
 * `@IsOptional()` deliberately allows `null` through (it skips validation
 * for both `null` and `undefined`); the service distinguishes them.
 */
export class SetChainDto {
  @ApiPropertyOptional({
    example: 5,
    nullable: true,
    description: 'Level 1 approver (users.id). null clears it; omit to leave unchanged.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  l1_approver_id?: number | null;

  @ApiPropertyOptional({
    example: 7,
    nullable: true,
    description: 'Level 2 approver (users.id). null clears it; omit to leave unchanged.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  l2_approver_id?: number | null;
}
