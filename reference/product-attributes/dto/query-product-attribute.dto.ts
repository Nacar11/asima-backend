import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductAttributeDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by product ID' })
  @IsNumber()
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  product_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by attribute ID' })
  @IsNumber()
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  attribute_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'Page number', default: 1 })
  @IsNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page',
    default: 10,
  })
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
