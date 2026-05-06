import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

/**
 * Basic Data Transfer Object for cost center identification.
 *
 * This DTO provides a minimal structure for cost center identification
 * operations where only the unique identifier is required. It's commonly
 * used for simple operations like deletion, status updates, or basic
 * retrieval where the full cost center entity is not needed.
 *
 * The DTO includes validation to ensure the ID is a valid integer and
 * is not empty, providing basic data integrity for cost center operations.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const costCenterDto: CostCenterDto = {
 *   id: 1
 * };
 * ```
 */
export class CostCenterDto {
  /** Unique identifier for the cost center */
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
