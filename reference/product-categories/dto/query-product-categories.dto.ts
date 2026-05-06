import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for querying product categories with filters
 */
export class QueryProductCategoriesDto {
  @ApiPropertyOptional({
    description: 'Filter by product ID',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  productId?: number;

  @ApiPropertyOptional({
    description: 'Filter by category name (case-insensitive partial match)',
    type: String,
  })
  @IsOptional()
  @IsString()
  categoryName?: string;
}
