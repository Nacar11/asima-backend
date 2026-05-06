import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for querying banks with filters
 */
export class QueryBankDto {
  @ApiPropertyOptional({
    type: String,
    example: 'BPI',
    description: 'Search by bank code or bank name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'BPI',
    description: 'Filter by exact bank code',
  })
  @IsOptional()
  @IsString()
  bank_code?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Filter by active status',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  is_active?: boolean;

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
    example: 'ASC',
    description: 'Sort by display_order (ASC or DESC, default: ASC)',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';
}
