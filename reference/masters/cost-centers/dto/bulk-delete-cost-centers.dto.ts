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
 * Data Transfer Object for bulk deletion of cost centers.
 *
 * This DTO defines the structure for bulk deletion operations, allowing
 * deletion of multiple cost centers in a single request. It includes
 * validation to ensure proper data format and reasonable limits.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const bulkDeleteDto: BulkDeleteCostCentersDto = {
 *   ids: [1, 2, 3, 4, 5]
 * };
 * ```
 */
export class BulkDeleteCostCentersDto {
  /** Array of cost center IDs to delete (1-100 items) */
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
