import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for starting a milestone.
 */
export class StartMilestoneDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Notes when starting the milestone',
    example: 'Starting work on consultation phase',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
