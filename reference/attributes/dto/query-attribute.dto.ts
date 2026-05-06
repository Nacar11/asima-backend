import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryAttributeDto {
  @ApiPropertyOptional({
    example: 'Size',
    description: 'Filter by attribute name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
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
    example: 'Active',
    description:
      'Filter by status. Only "Active" and "Inactive" are accepted values',
    enum: ['Active', 'Inactive'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['Active', 'Inactive'], {
    message: 'status must be either "Active" or "Inactive"',
  })
  status?: string;
}
