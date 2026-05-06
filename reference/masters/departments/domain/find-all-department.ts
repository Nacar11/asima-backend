import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * Domain entity for simplified department data in list operations.
 *
 * This domain entity represents a simplified view of department data
 * used in list operations, dropdowns, and lookup scenarios. It contains
 * only the essential fields needed for display and selection purposes,
 * excluding sensitive or unnecessary information for performance optimization.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Get all departments for dropdown
 * const departments: FindAllDepartment[] = await this.departmentsService.findAll();
 * // Returns: [
 * //   { id: 1, department_code: '01', department_name: 'Information Technology' },
 * //   { id: 2, department_code: '02', department_name: 'Human Resources' }
 * // ]
 * ```
 */
export class FindAllDepartment {
  /**
   * Unique identifier of the department.
   *
   * The primary key that uniquely identifies a department in the system.
   * Used for selection, updates, and other operations that require
   * department identification.
   *
   * @example 1
   * @example 5
   * @example 10
   */
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  /**
   * Unique department code identifier.
   *
   * A 2-character code that uniquely identifies the department.
   * Used for system identification and display in user interfaces.
   * This code is typically displayed alongside the department name.
   *
   * @example "01"
   * @example "99"
   * @example "00"
   */
  @ApiProperty({
    type: () => String,
    nullable: false,
    example: '00',
  })
  department_code: string;

  /**
   * Human-readable name of the department.
   *
   * The full name of the department, used for display purposes
   * in user interfaces, dropdowns, and selection lists.
   * This is the primary identifier users will see and interact with.
   *
   * @example "Information Technology"
   * @example "Human Resources"
   * @example "Finance"
   */
  @ApiProperty({
    type: () => String,
    nullable: false,
    example: 'Back Office',
  })
  department_name: string;

  /**
   * Internal entity identifier (excluded from serialization).
   *
   * This field is used internally by the system for entity tracking
   * and is excluded from API responses to keep the interface clean.
   * It should not be used in client applications.
   *
   * @private
   */
  @Exclude()
  __entity?: string;
}
