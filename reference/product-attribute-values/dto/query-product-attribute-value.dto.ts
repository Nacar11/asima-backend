import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for querying product attribute values with filters
 */
export class QueryProductAttributeValueDto {
  @ApiPropertyOptional({ description: 'Filter by product variant ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  product_variant_id?: number;

  @ApiPropertyOptional({ description: 'Filter by product attribute ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  product_attribute_id?: number;

  @ApiPropertyOptional({ description: 'Filter by attribute value ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  attribute_value_id?: number;

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
}
