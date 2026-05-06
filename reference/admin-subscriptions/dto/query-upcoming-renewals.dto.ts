import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for querying upcoming renewals.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryUpcomingRenewalsDto {
  @ApiPropertyOptional({
    description: 'Number of days ahead to look for renewals (default: 7)',
    example: 7,
    minimum: 1,
    maximum: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(90)
  days?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;
}
