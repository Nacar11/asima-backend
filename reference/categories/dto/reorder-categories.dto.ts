import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Single category display order item
 */
export class CategoryOrderItem {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Category ID',
  })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'New display order value',
  })
  @IsInt()
  @Min(1)
  display_order: number;
}

/**
 * DTO for batch reordering categories
 */
export class ReorderCategoriesDto {
  @ApiProperty({
    type: [CategoryOrderItem],
    description: 'Array of category IDs with their new display_order values',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderItem)
  categories: CategoryOrderItem[];
}
