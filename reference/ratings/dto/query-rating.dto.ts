import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters for listing ratings.
 */
export class QueryRatingDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by seller ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  seller_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by service ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  service_id?: number;
}
