import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FeaturedSectionEnum } from '@/products/products.enum';

/**
 * DTO for reordering featured products (admin endpoint)
 * Reordering is per-section, so section is required
 */
export class ReorderFeaturedDto {
  @ApiProperty({
    type: [Number],
    description:
      'Array of product IDs in the desired order. First item = order 1, second = order 2, etc.',
    example: [3, 1, 2],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  product_ids: number[];

  @ApiProperty({
    enum: FeaturedSectionEnum,
    description: 'Section to reorder (required - reordering is per-section)',
    example: FeaturedSectionEnum.FEATURED,
  })
  @IsNotEmpty()
  @IsEnum(FeaturedSectionEnum)
  section: FeaturedSectionEnum;
}
