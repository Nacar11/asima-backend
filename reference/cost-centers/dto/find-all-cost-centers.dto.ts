import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { StatusEnum } from '@/utils/enums/status-enum';

/**
 * Find All Cost Centers Data Transfer Object
 *
 * DTO for querying and filtering cost centers with pagination support.
 * Provides search functionality across cost center codes, names, and related
 * organizational entities (division, department, section, sub-section).
 *
 * Supports filtering by status and provides pagination controls for large datasets.
 *
 * @example
 * ```typescript
 * const queryDto: FindAllCostCentersDto = {
 *   search: 'Backend',
 *   page: 1,
 *   limit: 10,
 *   status: [StatusEnum.ACTIVE]
 * };
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
export class FindAllCostCentersDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    default: StatusEnum.ACTIVE,
    example: `${StatusEnum.ACTIVE},${StatusEnum.CANCELLED}`,
  })
  @IsOptional()
  @Transform(({ value }) => value?.split(',').map((val) => val.trim()))
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(StatusEnum, {
    each: true,
    message: 'Each status must be a valid status from the enum',
  })
  status?: StatusEnum[];
}
