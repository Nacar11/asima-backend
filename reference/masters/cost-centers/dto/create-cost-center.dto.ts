import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  Matches,
  IsOptional,
  ValidateIf,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { StatusEnum } from '@/utils/enums/status-enum';

/**
 * Data Transfer Object for creating a new cost center.
 *
 * This DTO defines the structure and validation rules for creating cost centers
 * in the organizational hierarchy. The cost center code is automatically generated
 * based on the provided organizational structure codes.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const createDto: CreateCostCenterDto = {
 *   division: '01',
 *   department: '01',
 *   section: '01',
 *   sub_section: '01',
 *   remarks: 'Backend Development Team',
 *   status: StatusEnum.ACTIVE
 * };
 * ```
 */
export class CreateCostCenterDto {
  /** Division code (required) - must be between 00 and 99 */
  @ApiProperty({ type: String, required: true, example: '00' })
  @IsString()
  @Matches(/^(0[0-9]|[1-9][0-9])$/, {
    message: 'Division must only contain numbers between 00 and 99',
  })
  division: string;

  /** Department code (optional) - required if section is provided */
  @ApiPropertyOptional({ type: String, required: false, example: '01' })
  @ValidateIf((o) => o.section)
  @IsNotEmpty({ message: 'Department is required when Section is provided' })
  @IsString()
  @Matches(/^(0[0-9]|[1-9][0-9])$/, {
    message: 'Department must only contain numbers between 00 and 99',
  })
  department: string;

  /** Section code (optional) - required if sub-section is provided */
  @ApiPropertyOptional({ type: String, required: false, example: '02' })
  @ValidateIf((o) => o.sub_section)
  @IsNotEmpty({ message: 'Section is required when SubSection is provided' })
  @IsString()
  @Matches(/^(0[0-9]|[1-9][0-9])$/, {
    message: 'Section must only contain numbers between 00 and 99',
  })
  section: string;

  /** Sub-section code (optional) */
  @ApiPropertyOptional({ type: String, required: false, example: '03' })
  @IsOptional()
  @IsString()
  @Matches(/^(0[0-9]|[1-9][0-9])$/, {
    message: 'SubSection must only contain numbers between 00 and 99',
  })
  sub_section: string;

  /** Additional remarks or description for the cost center */
  @ApiPropertyOptional({
    type: String,
    required: false,
    example: 'To be used by SD1 Backend Engineers',
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  /** Initial status of the cost center (defaults to Active) */
  @ApiPropertyOptional({
    type: String,
    enum: StatusEnum,
    description: 'Cost Center status',
    default: StatusEnum.ACTIVE,
    example: StatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StatusEnum, {
    message: 'status must be a valid status from the enum',
  })
  status?: StatusEnum;
}
