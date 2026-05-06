import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

/**
 * Data Transfer Object for department identification.
 *
 * This DTO is used for operations that require only the department ID,
 * such as retrieving a specific department or performing operations
 * on an existing department. It provides a simple, focused interface
 * for department identification.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Get a specific department by ID
 * const departmentDto: DepartmentDto = {
 *   id: 1
 * };
 *
 * // Use in API endpoints
 * @Get(':id')
 * findById(@Param() departmentDto: DepartmentDto) {
 *   return this.departmentsService.findById(departmentDto.id);
 * }
 * ```
 */
export class DepartmentDto {
  /**
   * Unique identifier of the department.
   *
   * The primary key that uniquely identifies a department in the system.
   * Must be a positive integer and is required for all operations.
   *
   * @example 1
   * @example 5
   * @example 10
   */
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
