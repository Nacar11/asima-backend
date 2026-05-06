import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  Min,
} from 'class-validator';

/**
 * Bulk Delete Cost Centers Data Transfer Object
 *
 * DTO for bulk deleting cost centers with validation for the IDs array.
 * Ensures proper validation of the cost center IDs to be deleted.
 *
 * @example
 * ```typescript
 * const bulkDeleteDto: BulkDeleteCostCentersDto = {
 *   ids: [10, 11, 12, 13, 14]
 * };
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
export class BulkDeleteCostCentersDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of cost center IDs to delete',
    example: [10, 11, 12, 13, 14],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray({ message: 'ids must be an array' })
  @IsNotEmpty({ message: 'ids array cannot be empty' })
  @ArrayMinSize(1, { message: 'At least one cost center ID must be provided' })
  @ArrayMaxSize(100, {
    message: 'Cannot delete more than 100 cost centers at once',
  })
  @IsInt({ each: true, message: 'Each ID must be a valid integer' })
  @Min(1, { each: true, message: 'Each ID must be a positive integer' })
  ids: number[];
}
