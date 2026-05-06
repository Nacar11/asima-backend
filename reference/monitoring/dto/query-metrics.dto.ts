import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for querying metrics.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryMetricsDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Maximum number of metrics to return',
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Start date for filtering metrics',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'End date for filtering metrics',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
