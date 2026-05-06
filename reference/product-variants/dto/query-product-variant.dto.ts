import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductVariantDto {
  @ApiPropertyOptional({ description: 'Filter by SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Filter by variant name' })
  @IsOptional()
  @IsString()
  variant_name?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['Active', 'Inactive'],
  })
  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  @Type(() => String)
  status?: 'Active' | 'Inactive';

  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  product_id?: number;

  @ApiPropertyOptional({ description: 'Number of items to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ description: 'Number of items to take', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  take?: number;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  @Type(() => String)
  sortBy?: 'ASC' | 'DESC';
}
