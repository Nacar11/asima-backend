import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating a product specification
 */
export class CreateProductSpecificationDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsNumber()
  product_id: number;

  @ApiProperty({
    example: 'Display Size',
    description: 'Name of the specification',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  specification_name: string;

  @ApiPropertyOptional({
    example: 'inches',
    description: 'Unit of measurement',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiProperty({
    example: '6.7',
    description: 'Value of the specification',
  })
  @IsString()
  @MinLength(1)
  specification_value: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Sort order for display',
  })
  @IsOptional()
  @IsNumber()
  sort_order?: number;
}
