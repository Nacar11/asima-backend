import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

/**
 * Data Transfer Object for performing bulk deletion of sub-sections.
 *
 * This DTO defines the required fields needed to perform bulk deletion
 * of multiple sub-sections in a single operation. It includes validation
 * rules for the array of IDs ensuring data integrity and performance.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 */
export class BulkDeleteSubSectionsDto {
  /**
   * Array of sub-section IDs to delete.
   *
   * This field contains the list of sub-section identifiers to be deleted
   * in a single operation. It supports bulk operations for efficiency
   * and includes validation to ensure data integrity.
   *
   * @example [1, 2, 3]
   * @example [10, 20, 30, 40]
   */
  @ApiProperty({
    description: 'Array of sub-section IDs to delete',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one sub-section ID is required' })
  @ArrayMaxSize(100, {
    message: 'Maximum 100 sub-sections can be deleted at once',
  })
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(Number.MAX_SAFE_INTEGER, { each: true })
  ids: number[];
}
