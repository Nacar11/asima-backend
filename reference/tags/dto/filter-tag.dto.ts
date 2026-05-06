import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsEnum,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TagSortBy {
  NAME = 'name',
  PRODUCT_COUNT = 'product_count',
  DISPLAY_ORDER = 'display_order',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FilterTagDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Search in name, slug, or description',
    example: 'organic',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Filter by seller ID',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seller_id?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Minimum product count',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_count?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Maximum product count',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_count?: number;

  @ApiPropertyOptional({
    enum: TagSortBy,
    description: 'Sort field',
    example: TagSortBy.NAME,
    default: TagSortBy.NAME,
  })
  @IsOptional()
  @IsEnum(TagSortBy)
  sort_by?: TagSortBy;

  @ApiPropertyOptional({
    enum: SortOrder,
    description: 'Sort order',
    example: SortOrder.ASC,
    default: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort_order?: SortOrder;

  @ApiPropertyOptional({
    type: Number,
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Items per page (max 100)',
    example: 50,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include soft-deleted tags',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_archived?: boolean;

  @ApiPropertyOptional({
    enum: ['Active', 'Inactive'],
    example: 'Active',
    description: 'Filter by status: Active or Inactive',
  })
  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;
}
