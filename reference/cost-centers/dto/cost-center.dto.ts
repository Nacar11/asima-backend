import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

/**
 * Cost Center Data Transfer Object
 *
 * Simple DTO for cost center identification and basic operations.
 * Contains only the essential ID field for cost center references.
 *
 * @example
 * ```typescript
 * const costCenterDto: CostCenterDto = {
 *   id: 1
 * };
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
export class CostCenterDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
