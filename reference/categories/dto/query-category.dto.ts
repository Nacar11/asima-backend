import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';

/**
 * DTO for querying categories with filters
 */
export class QueryCategoryDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Electronics',
    description: 'Filter by category name',
  })
  @IsOptional()
  @IsString()
  category_name?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      'Filter by seller ID. If provided, returns only categories for that seller',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  seller_id?: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description:
      'Filter for global categories only (seller_id = NULL). Used by admin endpoints.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  isGlobal?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description:
      'Include global categories along with seller categories. Default: false for categories page, true for product form/filter.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  include_global?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Number of items to skip (default: 0)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items to take/return (default: 20)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  take?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'DESC',
    description: 'Sort by created_at (ASC or DESC, default: DESC)',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    enum: ActiveInactiveStatusEnum,
    example: ActiveInactiveStatusEnum.ACTIVE,
    description: 'Filter by status: Active or Inactive',
  })
  @IsOptional()
  @IsEnum(ActiveInactiveStatusEnum)
  status?: ActiveInactiveStatusEnum;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description:
      'Filter to only include categories whose seller is active. Global categories (seller_id = NULL) are always included.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  active_seller_only?: boolean;
}
