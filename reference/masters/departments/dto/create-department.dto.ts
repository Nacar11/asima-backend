import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { StatusEnum } from '@/utils/enums/status-enum';

/**
 * Data Transfer Object for creating a new department.
 *
 * This DTO defines the required and optional fields needed to create
 * a new department in the system. It includes validation rules for
 * department codes, names, and status, ensuring data integrity
 * and consistency across the application.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Create a new department
 * const createDto: CreateDepartmentDto = {
 *   department_code: '01',
 *   department_name: 'Information Technology',
 *   department_head: 1,
 *   status: StatusEnum.ACTIVE
 * };
 *
 * // Create with minimal required fields
 * const createDto: CreateDepartmentDto = {
 *   department_code: '02',
 *   department_name: 'Human Resources',
 *   department_head: 2
 * };
 * ```
 */
export class CreateDepartmentDto {
  /**
   * Unique department code identifier.
   *
   * A 2-character code that uniquely identifies the department.
   * Must be exactly 2 characters long and contain only numbers
   * between 00 and 99. This code is used for system identification
   * and must be unique across all departments.
   *
   * @example "01"
   * @example "99"
   * @example "00"
   */
  @ApiProperty({
    type: () => String,
    required: true,
    example: '00',
  })
  @IsString()
  @Length(2, 2)
  @Matches(/^(0[0-9]|[1-9][0-9])$/, {
    message: 'Code must only contain numbers between 00 and 99',
  })
  department_code: string;

  /**
   * Human-readable name of the department.
   *
   * The full name of the department, used for display purposes
   * and in user interfaces. Must be between 1 and 100 characters long.
   * This is the primary identifier users will see and interact with.
   *
   * @example "Information Technology"
   * @example "Human Resources"
   * @example "Finance"
   */
  @ApiProperty({
    type: () => String,
    required: true,
    example: 'CODY',
  })
  @IsString()
  @Length(1, 100)
  department_name: string;

  /**
   * ID of the user who serves as the department head.
   *
   * Reference to the user who is designated as the head of this department.
   * Must be a valid user ID that exists in the system. The department head
   * is responsible for the department and appears in related operations.
   *
   * @example 1
   * @example 5
   * @example 10
   */
  @ApiProperty({
    type: Number,
    required: true,
    example: 1,
  })
  @IsInt()
  department_head: number;

  /**
   * Current status of the department.
   *
   * Indicates whether the department is active, on hold, or cancelled.
   * If not provided, defaults to ACTIVE. This field controls the
   * department's availability for use in the system.
   *
   * @example StatusEnum.ACTIVE
   * @example StatusEnum.HOLD
   * @example StatusEnum.CANCELLED
   */
  @ApiPropertyOptional({
    type: String,
    enum: StatusEnum,
    description: 'Department status',
    default: StatusEnum.ACTIVE,
    example: StatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StatusEnum, {
    message: 'status must be a valid status from the enum',
  })
  status?: StatusEnum;
}
