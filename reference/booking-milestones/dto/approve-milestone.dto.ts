import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for approving a milestone.
 *
 * Used when customer approves a submitted milestone.
 *
 * @version 1
 * @since 1.0.0
 */
export class ApproveMilestoneDto {
  @ApiPropertyOptional({
    description: 'Customer notes/feedback',
    example: 'Looks great!',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customer_notes?: string;
}
