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
 * Bulk Delete Departments Data Transfer Object
 *
 * DTO for bulk deleting departments with validation for the IDs array.
 * Ensures proper validation of the department IDs to be deleted.
 *
 * @example
 * ```typescript
 * const bulkDeleteDto: BulkDeleteDepartmentsDto = {
 *   ids: [1, 2, 3, 4, 5]
 * };
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
export class BulkDeleteDepartmentsDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of department IDs to delete',
    example: [1, 2, 3, 4, 5],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray({ message: 'ids must be an array' })
  @IsNotEmpty({ message: 'ids array cannot be empty' })
  @ArrayMinSize(1, { message: 'At least one department ID must be provided' })
  @ArrayMaxSize(100, {
    message: 'Cannot delete more than 100 departments at once',
  })
  @IsInt({ each: true, message: 'Each ID must be a valid integer' })
  @Min(1, { each: true, message: 'Each ID must be a positive integer' })
  ids: number[];
}
