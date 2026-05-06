import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * Simplified domain entity for division lookup operations.
 *
 * This domain entity represents a lightweight division object containing
 * only essential fields for lookup and selection operations. It's optimized
 * for API responses and client-side operations where full entity data
 * is not required.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const lookupEntity = new FindAllDivision();
 * lookupEntity.id = 1;
 * lookupEntity.division_code = '01';
 * lookupEntity.division_name = 'Engineering';
 * ```
 */
export class FindAllDivision {
  /**
   * Unique identifier for the division.
   *
   * This field serves as the primary key for the division entity
   * and is used for identification in lookup operations.
   *
   * @example 1
   * @example 123
   */
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  /**
   * Unique business code for the division.
   *
   * This field represents the human-readable business code for the division.
   * It must be unique across all divisions and follows a specific format.
   * The code is used for business operations and reporting.
   *
   * @example '00'
   * @example '01'
   * @example '99'
   */
  @ApiProperty({
    type: () => String,
    nullable: false,
    example: '00',
  })
  division_code: string;

  /**
   * Human-readable name of the division.
   *
   * This field contains the display name for the division used in
   * user interfaces and reports. It should be descriptive and
   * clearly identify the division's purpose or function.
   *
   * @example 'Engineering'
   * @example 'Marketing'
   * @example 'Sales'
   */
  @ApiProperty({
    type: () => String,
    nullable: false,
    example: 'CODY',
  })
  division_name: string;

  /**
   * Internal entity identifier for TypeORM.
   *
   * This field is used internally by TypeORM for entity management
   * and is excluded from serialization to prevent exposure in API responses.
   *
   * @example 'DivisionEntity'
   */
  @Exclude()
  __entity?: string;
}
