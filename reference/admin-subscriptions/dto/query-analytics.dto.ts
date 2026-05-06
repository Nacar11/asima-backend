import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

/**
 * DTO for querying subscription analytics.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryAnalyticsDto {
  @ApiPropertyOptional({
    description: 'Start date for analytics period',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date for analytics period',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
