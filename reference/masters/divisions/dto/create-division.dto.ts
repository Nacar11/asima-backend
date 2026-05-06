import {
  IsString,
  Length,
  IsInt,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusEnum } from '@/utils/enums/status-enum';

/**
 * Data Transfer Object for creating a new division.
 *
 * This DTO defines the required fields needed to create
 * a division in the system. It includes validation rules for
 * division code format, name length, and division head validation
 * ensuring data integrity and consistency.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const createDto: CreateDivisionDto = {
 *   division_code: '01',
 *   division_name: 'Engineering',
 *   division_head: 123,
 *   status: 'Active'
 * };
 * ```
 */
export class CreateDivisionDto {
  /**
   * Unique business code for the division.
   *
   * This field must be a 2-digit string containing numbers between 00 and 99.
   * The code must be unique across all divisions and follows a specific
   * format for business operations and reporting.
   *
   * @example '00'
   * @example '01'
   * @example '99'
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
    required: true,
    example: 'CODY',
  })
  @IsString()
  @Length(1, 100)
  division_name: string;

  /**
   * ID of the user who serves as the head of the division.
   *
   * This field references the user who will be responsible for
   * leading the division. The user must exist in the system and
   * be available for assignment as division head.
   *
   * @example 1
   * @example 123
   */
  @ApiProperty({
    type: Number,
    required: true,
    example: 1,
  })
  @IsInt()
  division_head: number;

  /**
   * Initial status of the division.
   *
   * This field sets the operational status of the division upon creation.
   * If not provided, defaults to 'Active'. Valid values include
   * Active, Hold, and Cancelled.
   *
   * @example 'Active'
   * @example 'Hold'
   * @example 'Cancelled'
   */
  @ApiPropertyOptional({
    type: String,
    enum: StatusEnum,
    description: 'Division status',
    default: StatusEnum.ACTIVE,
    example: StatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StatusEnum, {
    message: 'status must be a valid status from the enum',
  })
  status?: StatusEnum;
}
