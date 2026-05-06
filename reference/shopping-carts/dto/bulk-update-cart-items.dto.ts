import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for bulk updating cart items' selection status.
 *
 * Used to update the `is_selected` field for multiple cart items at once.
 *
 * @version 1
 * @since 1.0.0
 */
export class BulkUpdateCartItemsDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2, 3],
    description: 'Array of cart item IDs to update',
    minItems: 1,
  })
  @IsArray({ message: 'item_ids must be an array' })
  @ArrayMinSize(1, { message: 'At least one item ID is required' })
  @IsInt({ each: true, message: 'Each item ID must be an integer' })
  @Type(() => Number)
  item_ids: number[];

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'The selection status to apply to all specified items',
  })
  @IsBoolean({ message: 'is_selected must be a boolean' })
  is_selected: boolean;
}
