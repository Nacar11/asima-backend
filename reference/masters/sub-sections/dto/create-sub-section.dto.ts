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
 * Data Transfer Object for creating new sub-sections.
 *
 * This DTO defines the required fields needed to create
 * a sub-section in the system. It includes validation rules for
 * all fields ensuring data integrity and consistency.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 */
export class CreateSubSectionDto {
  /**
   * Unique business code for the sub-section.
   *
   * This field represents the human-readable business code for the sub-section.
   * It must be unique across all sub-sections and follows a specific format.
   * The code is used for business operations and reporting.
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
  sub_section_code: string;

  /**
   * Human-readable name of the sub-section.
   *
   * This field contains the display name for the sub-section used in
   * user interfaces and reports. It should be descriptive and
   * clearly identify the sub-section's purpose or function.
   *
   * @example 'Backend'
   * @example 'Frontend'
   * @example 'DevOps'
   */
  @ApiProperty({
    type: () => String,
    required: true,
    example: 'Backend',
  })
  @IsString()
  @Length(1, 100)
  sub_section_name: string;

  /**
   * The user ID who serves as the head of the sub-section.
   *
   * This field represents the ID of the person responsible for leading
   * the sub-section. It must reference an existing user in the system
   * and will be validated during creation.
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
  sub_section_head: number;

  /**
   * Current status of the sub-section.
   *
   * This field indicates the operational status of the sub-section.
   * Valid values include Active, Hold, and Cancelled. The status
   * determines whether the sub-section is operational and available
   * for business processes.
   *
   * @example StatusEnum.ACTIVE
   * @example StatusEnum.HOLD
   * @example StatusEnum.CANCELLED
   */
  @ApiPropertyOptional({
    type: String,
    enum: StatusEnum,
    description: 'Sub Section status',
    default: StatusEnum.ACTIVE,
    example: StatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StatusEnum, {
    message: 'status must be a valid status from the enum',
  })
  status?: StatusEnum;
}
