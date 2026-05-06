import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FeaturedSectionEnum } from '@/products/products.enum';

/**
 * Individual product in batch update
 */
export class BatchFeaturedProductItem {
  @ApiProperty({
    type: Number,
    description: 'Product ID',
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  product_id: number;

  @ApiProperty({
    type: Boolean,
    description: 'Whether to feature the product',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  is_featured: boolean;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: 'Display order for the featured product',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
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

/**
 * DTO for batch setting products as featured (admin endpoint)
 */
export class BatchSetFeaturedDto {
  @ApiProperty({
    type: [BatchFeaturedProductItem],
    description: 'Array of products to update featured status',
    minItems: 1,
    maxItems: 50,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BatchFeaturedProductItem)
  products: BatchFeaturedProductItem[];
}
