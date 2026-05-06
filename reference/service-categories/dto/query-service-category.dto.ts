import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryServiceCategoryDto {
  @ApiPropertyOptional({ description: 'Search by name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by exact name match' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Parent category filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parent_id?: number;

  @ApiPropertyOptional({ description: 'Is active flag' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Is featured flag' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['Active', 'Inactive'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by creator user ID (created_by)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  createdBy?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'name',
    description: 'Field to sort by',
    enum: [
      'name',
      'code',
      'created_at',
      'updated_at',
      'display_order',
      'parent_id',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'name',
    'code',
    'created_at',
    'updated_at',
    'display_order',
    'parent_id',
  ])
  sortField?:
    | 'name'
    | 'code'
    | 'created_at'
    | 'updated_at'
    | 'display_order'
    | 'parent_id';

  @ApiPropertyOptional({
    type: String,
    example: 'ASC',
    description: 'Sort direction (ASC or DESC, default: ASC)',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';
}
