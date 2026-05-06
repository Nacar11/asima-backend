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
 * Data Transfer Object for querying cost centers with filtering and pagination.
 *
 * This DTO provides parameters for searching, filtering, and paginating cost centers.
 * It supports text search, status filtering, and standard pagination controls.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const queryDto: FindAllCostCentersDto = {
 *   search: 'Backend',
 *   page: 1,
 *   limit: 20,
 *   status: [StatusEnum.ACTIVE, StatusEnum.HOLD]
 * };
 * ```
 */
export class FindAllCostCentersDto {
  /** Search term to filter cost centers by code or name */
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  /** Page number for pagination (defaults to 1) */
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  /** Number of items per page (defaults to 10) */
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  /** Filter by cost center status (comma-separated list) */
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
