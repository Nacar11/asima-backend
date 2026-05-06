import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ReturnRequestStatusEnum } from '../domain/return-request-status.enum';

// Whitelist of allowed sort columns to prevent SQL injection
const ALLOWED_SORT_COLUMNS = [
  'created_at',
  'updated_at',
  'requested_at',
  'status',
  'order_id',
  'return_number',
] as const;

export class QueryReturnRequestDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ReturnRequestStatusEnum,
  })
  @IsOptional()
  @IsEnum(ReturnRequestStatusEnum)
  status?: ReturnRequestStatusEnum;

  @ApiPropertyOptional({
    description: 'Search term',
    example: 'damaged',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'created_at',
    default: 'created_at',
    enum: ALLOWED_SORT_COLUMNS,
  })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_SORT_COLUMNS)
  sort_by?: (typeof ALLOWED_SORT_COLUMNS)[number];

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC';
}
