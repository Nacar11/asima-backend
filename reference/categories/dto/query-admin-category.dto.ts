import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';

/**
 * DTO for querying global categories in admin endpoint.
 */
export class QueryAdminCategoryDto {
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
    default: false,
    example: false,
    description:
      'When true, returns a flat list where parent and child categories are independent entries. When false, returns tree data with nested child_categories.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  @IsBoolean()
  separate_child?: boolean;

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
