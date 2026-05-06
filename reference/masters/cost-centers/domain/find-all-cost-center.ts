import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * Simplified domain entity for cost center listings and lookups.
 *
 * This entity represents a lightweight version of the CostCenter entity
 * that includes only essential fields (id, code, name) for performance-optimized
 * operations like dropdowns, lookups, and simple listings. It excludes
 * full entity relationships to reduce payload size and improve response times.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const costCenter: FindAllCostCenter = {
 *   id: 1,
 *   cost_center_code: '01010101',
 *   cost_center_name: '01010101 / Backend'
 * };
 * ```
 */
export class FindAllCostCenter {
  /** Unique identifier for the cost center */
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  /** Unique cost center code */
  @ApiProperty({
    type: String,
    example: '01010101',
  })
  cost_center_code: string;

  /** Human-readable name of the cost center */
  @ApiProperty({
    type: String,
    example: '01010101 / Backend',
  })
  cost_center_name: string;

  @Exclude()
  __entity?: string;
}
