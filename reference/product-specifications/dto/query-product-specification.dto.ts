import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for querying product specifications with filters
 */
export class QueryProductSpecificationDto {
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Filter by product ID',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  product_id?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Display Size',
    description: 'Filter by specification name',
  })
  @IsOptional()
  @IsString()
  specification_name?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Page number for pagination',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  page: number = 1;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    description: 'Number of items per page (Default: 10)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return 10;
    return parseInt(value, 10);
  })
  @IsInt()
  limit: number = 10;
}
