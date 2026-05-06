import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query DTO for getting seller's reviews
 */
export class QuerySellerReviewsDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Number of items to skip',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  skip?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of items to take',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  take?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Filter by minimum rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  min_rating?: number;
}
