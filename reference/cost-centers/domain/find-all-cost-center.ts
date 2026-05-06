import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * Find All Cost Center Domain Entity
 *
 * Simplified cost center representation used for listing and selection purposes.
 * Contains only essential fields needed for dropdowns, lookups, and basic
 * cost center information display.
 *
 * This entity is optimized for performance when retrieving large lists of
 * cost centers without the full related entity data.
 *
 * @example
 * ```typescript
 * const costCenter = new FindAllCostCenter();
 * costCenter.id = 1;
 * costCenter.cost_center_code = '01010101';
 * costCenter.cost_center_name = 'Backend Development';
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
export class FindAllCostCenter {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: '01010101',
  })
  cost_center_code: string;

  @ApiProperty({
    type: String,
    example: '01010101 / Backend',
  })
  cost_center_name: string;

  @Exclude()
  __entity?: string;
}
