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
 * Bulk Delete Divisions Data Transfer Object
 *
 * DTO for bulk deleting divisions with validation for the IDs array.
 * Ensures proper validation of the division IDs to be deleted.
 *
 * @example
 * ```typescript
 * const bulkDeleteDto: BulkDeleteDivisionsDto = {
 *   ids: [1, 2, 3, 4, 5]
 * };
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
export class BulkDeleteDivisionsDto {
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
