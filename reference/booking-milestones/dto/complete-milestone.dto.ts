import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for completing a milestone.
 *
 * Used when provider completes a milestone and submits it for review.
 *
 * @version 1
 * @since 1.0.0
 */
export class CompleteMilestoneDto {
  @ApiPropertyOptional({
    description: 'Provider notes about completion',
    example: 'Completed as per requirements',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  provider_notes?: string;

  @ApiPropertyOptional({
    description: 'Photo/document URLs uploaded by the provider',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photo_urls?: string[];
}
