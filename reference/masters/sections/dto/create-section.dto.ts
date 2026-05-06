import { StatusEnum } from '@/utils/enums/status-enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * Data Transfer Object for creating a section.
 *
 * This DTO defines the required fields needed to create
 * a section in the system. It includes validation rules for
 * section code format, name length, and section head validation
 * ensuring data integrity and consistency.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const createDto = new CreateSectionDto();
 * createDto.section_code = '01';
 * createDto.section_name = 'Engineering';
 * createDto.section_head = 123;
 * createDto.status = StatusEnum.ACTIVE;
 * ```
 */
export class CreateSectionDto {
  /**
   * Unique business code for the section.
   *
   * This field represents the human-readable business code for the section.
   * It must be exactly 2 characters and contain only numbers between 00 and 99.
   * The code must be unique across all sections.
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
  section_code: string;

  /**
   * Human-readable name of the section.
   *
   * This field contains the display name for the section used in
   * user interfaces and reports. It must be between 1 and 100 characters
   * and should be descriptive and clearly identify the section's purpose.
   *
   * @example 'Engineering'
   * @example 'Marketing'
   * @example 'Sales'
   */
  @ApiProperty({
    type: () => String,
    required: true,
    example: 'SD1',
  })
  @IsString()
  @Length(1, 100)
  section_name: string;

  /**
   * ID of the user who serves as the head of the section.
   *
   * This field represents the user responsible for leading the section.
   * It must be a valid user ID that exists in the system and will
   * be validated during the creation process.
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
  section_head: number;

  /**
   * Current status of the section.
   *
   * This field indicates the operational status of the section.
   * Valid values include Active, Hold, and Cancelled. If not provided,
   * it defaults to Active status.
   *
   * @example StatusEnum.ACTIVE
   * @example StatusEnum.HOLD
   * @example StatusEnum.CANCELLED
   */
  @ApiPropertyOptional({
    type: String,
    enum: StatusEnum,
    description: 'Section status',
    default: StatusEnum.ACTIVE,
    example: StatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StatusEnum, {
    message: 'status must be a valid status from the enum',
  })
  status?: StatusEnum;
}
