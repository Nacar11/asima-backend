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
 * Data Transfer Object for bulk deletion of bookings.
 *
 * This DTO defines the structure for bulk deletion operations, allowing
 * deletion of multiple bookings in a single request. It includes
 * validation to ensure proper data format and reasonable limits.
 *
 * @version 1
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const bulkDeleteDto: BulkDeleteBookingsDto = {
 *   ids: [1, 2, 3, 4, 5]
 * };
 * ```
 */
export class BulkDeleteBookingsDto {
  /** Array of booking IDs to delete (1-100 items) */
  @ApiProperty({
    type: [Number],
    description: 'Array of booking IDs to delete',
    example: [10, 11, 12, 13, 14],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray({ message: 'ids must be an array' })
  @IsNotEmpty({ message: 'ids array cannot be empty' })
  @ArrayMinSize(1, { message: 'At least one booking ID must be provided' })
  @ArrayMaxSize(100, {
    message: 'Cannot delete more than 100 bookings at once',
  })
  @IsInt({ each: true, message: 'Each ID must be a valid integer' })
  @Min(1, { each: true, message: 'Each ID must be a positive integer' })
  ids: number[];
}
