import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

/**
 * Data Transfer Object for division identification.
 *
 * This DTO defines the required field for identifying a division
 * in the system. It includes validation rules for the division ID
 * ensuring data integrity and proper identification.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const divisionDto: DivisionDto = {
 *   id: 1
 * };
 * ```
 */
export class DivisionDto {
  /**
   * Unique identifier of the division.
   *
   * This field represents the primary key of the division entity.
   * It must be a positive integer and correspond to an existing
   * division in the system.
   *
   * @example 1
   * @example 123
   */
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
