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
 * Data Transfer Object for bulk deletion of service packages.
 *
 * This DTO is used for operations that require deleting multiple service packages
 * in a single request. It includes validation to ensure the operation is
 * safe and performant by limiting the number of service packages that can be
 * deleted at once and validating all IDs.
 *
 * @version 1
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * // Delete multiple service packages
 * const bulkDeleteDto: BulkDeleteServicePackagesDto = {
 *   ids: [1, 2, 3, 4, 5]
 * };
 *
 * // Delete a single service package
 * const bulkDeleteDto: BulkDeleteServicePackagesDto = {
 *   ids: [1]
 * };
 * ```
 */
export class BulkDeleteServicePackagesDto {
  /**
   * Array of service package IDs to delete.
   *
   * Contains the unique identifiers of service packages to be deleted.
   * Must contain at least 1 ID and at most 100 IDs to ensure
   * safe and performant bulk operations. Each ID must be a
   * positive integer that exists in the system.
   *
   * @example [1, 2, 3, 4, 5]
   * @example [10, 20, 30]
   * @example [1]
   */
  @ApiProperty({
    type: [Number],
    description: 'Array of service package IDs to delete',
    example: [1, 2, 3, 4, 5],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray({ message: 'ids must be an array' })
  @IsNotEmpty({ message: 'ids array cannot be empty' })
  @ArrayMinSize(1, {
    message: 'At least one service package ID must be provided',
  })
  @ArrayMaxSize(100, {
    message: 'Cannot delete more than 100 service packages at once',
  })
  @IsInt({ each: true, message: 'Each ID must be a valid integer' })
  @Min(1, { each: true, message: 'Each ID must be a positive integer' })
  ids: number[];
}
