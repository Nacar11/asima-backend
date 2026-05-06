import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for bulk deleting cart items.
 *
 * Used to soft-delete multiple cart items at once.
 * Maximum 100 items can be deleted in a single request.
 *
 * @version 1
 * @since 1.0.0
 */
export class BulkDeleteCartItemsDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2, 3],
    description: 'Array of cart item IDs to delete (1-100 items)',
    minItems: 1,
    maxItems: 100,
  })
  @IsArray({ message: 'item_ids must be an array' })
  @ArrayMinSize(1, { message: 'At least one item ID is required' })
  @ArrayMaxSize(100, { message: 'Maximum 100 items can be deleted at once' })
  @IsInt({ each: true, message: 'Each item ID must be an integer' })
  @Type(() => Number)
  item_ids: number[];
}
