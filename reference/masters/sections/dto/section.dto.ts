import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

/**
 * Data Transfer Object for section identification.
 *
 * This DTO defines the required field for identifying a section
 * in the system. It includes validation rules for the section ID
 * to ensure data integrity and proper identification.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const sectionDto = new SectionDto();
 * sectionDto.id = 1;
 * ```
 */
export class SectionDto {
  /**
   * Unique identifier for the section.
   *
   * This field represents the primary key for the section and is
   * used for identification in various operations. It must be a
   * valid positive integer that exists in the system.
   *
   * @example 1
   * @example 123
   */
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
