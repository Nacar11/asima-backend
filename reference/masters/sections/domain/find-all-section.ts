import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * Simplified domain entity for section lookup operations.
 *
 * This domain entity represents a lightweight section object containing
 * only essential fields for lookup and selection operations. It's optimized
 * for API responses and client-side operations where full section data
 * is not required.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const lookupSection = new FindAllSection();
 * lookupSection.id = 1;
 * lookupSection.section_code = '01';
 * lookupSection.section_name = 'Engineering';
 * ```
 */
export class FindAllSection {
  /**
   * Unique identifier for the section.
   *
   * This field serves as the primary key for the section and is
   * used for identification in lookup operations.
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
   * Unique business code for the section.
   *
   * This field represents the human-readable business code for the section.
   * It's used for business operations and reporting in lookup operations.
   *
   * @example '00'
   * @example '01'
   * @example '99'
   */
  @ApiProperty({
    type: () => String,
    nullable: false,
    example: '01',
  })
  section_code: string;

  /**
   * Human-readable name of the section.
   *
   * This field contains the display name for the section used in
   * lookup operations and selection components.
   *
   * @example 'Engineering'
   * @example 'Marketing'
   * @example 'Sales'
   */
  @ApiProperty({
    type: () => String,
    nullable: false,
    example: 'SD1',
  })
  section_name: string;

  /**
   * Internal entity type identifier.
   *
   * This field is used internally for entity type identification
   * and is excluded from serialization. It helps with type
   * checking and entity management in the system.
   *
   * @example "FindAllSection"
   */
  @Exclude()
  __entity?: string;
}
