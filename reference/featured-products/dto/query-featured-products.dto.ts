import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FeaturedSectionEnum } from '@/products/products.enum';

/**
 * DTO for querying featured products (public endpoint)
 */
export class QueryFeaturedProductsDto {
  @ApiPropertyOptional({
    enum: FeaturedSectionEnum,
    description: 'Filter by featured section',
    example: FeaturedSectionEnum.FEATURED,
  })
  @IsOptional()
  @IsEnum(FeaturedSectionEnum)
  section?: FeaturedSectionEnum;

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
    maximum: 50,
    default: 20,
    description: 'Number of items to take/return (default: 20, max: 50)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'tech-store,dpo-food-trading',
    description:
      'Comma-separated seller slugs to exclude (case-insensitive). e.g. "store-a,store-b"',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const slugs = String(value)
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    return slugs.length > 0 ? slugs : undefined;
  })
  exclude_seller_slug?: string[];
}
