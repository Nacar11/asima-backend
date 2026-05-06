import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, IsNumber, Min } from 'class-validator';

/**
 * Sync ProductCategories DTO
 * Replaces all categories for a product with the provided list
 */
export class SyncProductCategoriesDto {
  @ApiProperty({
    type: [Number],
    example: [1, 3, 5],
    description: 'List of category IDs to associate with the product',
  })
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  category_ids: number[];
}
