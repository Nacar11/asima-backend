import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FeaturedSectionEnum } from '@/products/products.enum';

/**
 * DTO for setting a product as featured (admin endpoint)
 * Use PATCH /admin/products/:id/unfeatured to remove from featured
 */
export class SetFeaturedProductDto {
  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description:
      'Display order for the featured product. If not provided, adds to end. If provided, inserts at position and shifts others.',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  featured_order?: number;

  @ApiPropertyOptional({
    enum: FeaturedSectionEnum,
    default: FeaturedSectionEnum.FEATURED,
    description: 'Section where product should be featured',
    example: FeaturedSectionEnum.FEATURED,
  })
  @IsOptional()
  @IsEnum(FeaturedSectionEnum)
  featured_section?: FeaturedSectionEnum;
}
