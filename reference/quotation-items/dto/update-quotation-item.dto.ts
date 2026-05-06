import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO for updating a quotation line item.
 */
export class UpdateQuotationItemDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Compressor Replacement (Updated)',
    description: 'Name/title of the line item',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Updated description',
    description: 'Description of the work/material',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 2,
    description: 'Quantity',
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'unit',
    description: 'Unit type (e.g., unit, hour, meter)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  unit_type?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 5500.0,
    description: 'Price per unit',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  unit_price?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-02-15',
    description: 'Suggested schedule date for this item',
  })
  @IsString()
  @IsOptional()
  suggested_schedule_date?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 2,
    description: 'Order of items in the quotation',
  })
  @IsInt()
  @IsOptional()
  sequence_order?: number;
}
