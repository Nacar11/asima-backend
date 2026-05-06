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
 * Data Transfer Object for bulk deletion of sections.
 *
 * This DTO defines the required fields for performing bulk deletion
 * of multiple sections in a single operation. It includes validation
 * rules for the array of section IDs, ensuring data integrity and
 * preventing abuse through reasonable limits.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const bulkDeleteDto = new BulkDeleteSectionsDto();
 * bulkDeleteDto.ids = [1, 2, 3, 4, 5];
 * // Validates: 1-100 sections can be deleted at once
 * ```
 */
export class BulkDeleteSectionsDto {
  /**
   * Array of section IDs to delete.
   *
   * This field contains the unique identifiers of sections to be deleted
   * in a single bulk operation. It must contain at least 1 ID and at most
   * 100 IDs to prevent system overload and ensure reasonable processing times.
   * Each ID must be a valid positive integer.
   *
   * @example [1, 2, 3]
   * @example [10, 20, 30, 40, 50]
   */
  @ApiProperty({
    description: 'Array of section IDs to delete',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one section ID is required' })
  @ArrayMaxSize(100, { message: 'Maximum 100 sections can be deleted at once' })
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(Number.MAX_SAFE_INTEGER, { each: true })
  ids: number[];
}
