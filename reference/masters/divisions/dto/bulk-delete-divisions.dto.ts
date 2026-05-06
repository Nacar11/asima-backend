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
 * Data Transfer Object for bulk deletion of divisions.
 *
 * This DTO defines the required fields for performing bulk deletion
 * operations on multiple divisions. It includes validation rules for
 * array size limits and ID format validation ensuring data integrity.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const bulkDeleteDto: BulkDeleteDivisionsDto = {
 *   ids: [1, 2, 3, 4, 5]
 * };
 * ```
 */
export class BulkDeleteDivisionsDto {
  /**
   * Array of division identifiers to delete.
   *
   * This field contains the IDs of divisions to be deleted in a single
   * operation. The array must contain between 1 and 100 valid division IDs.
   * Each ID must be a positive integer representing an existing division.
   *
   * @example [1, 2, 3, 4, 5]
   * @example [10, 20, 30]
   */
  @ApiProperty({
    type: [Number],
    description: 'Array of division IDs to delete',
    example: [1, 2, 3, 4, 5],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray({ message: 'ids must be an array' })
  @IsNotEmpty({ message: 'ids array cannot be empty' })
  @ArrayMinSize(1, { message: 'At least one division ID must be provided' })
  @ArrayMaxSize(100, {
    message: 'Cannot delete more than 100 divisions at once',
  })
  @IsInt({ each: true, message: 'Each ID must be a valid integer' })
  @Min(1, { each: true, message: 'Each ID must be a positive integer' })
  ids: number[];
}
