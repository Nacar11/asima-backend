import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FeaturedSectionEnum } from '@/products/products.enum';

/**
 * Sort field options for admin featured list
 */
export type FeaturedSortField =
  | 'featured_order'
  | 'featured_at'
  | 'product_name';

/**
 * DTO for querying featured products (admin endpoint)
 */
export class QueryAdminFeaturedDto {
  @ApiPropertyOptional({
    enum: FeaturedSectionEnum,
    description: 'Filter by featured section',
    example: FeaturedSectionEnum.FEATURED,
  })
  @IsOptional()
  @IsEnum(FeaturedSectionEnum)
  section?: FeaturedSectionEnum;

  @ApiPropertyOptional({
    type: String,
    enum: ['featured_order', 'featured_at', 'product_name'],
    default: 'featured_order',
    description: 'Sort field',
    example: 'featured_order',
  })
  @IsOptional()
  @IsIn(['featured_order', 'featured_at', 'product_name'])
  sortBy?: FeaturedSortField;

  @ApiPropertyOptional({
    type: String,
    enum: ['ASC', 'DESC'],
    default: 'ASC',
    description: 'Sort order',
    example: 'ASC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    default: 0,
    description: 'Number of items to skip (default: 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Number of items to take/return (default: 20, max: 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
