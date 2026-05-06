import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuotationItemTypeEnum } from '@/quotation-items/enums/quotation-item-type.enum';

/**
 * DTO for creating a quotation line item.
 */
export class CreateQuotationItemDto {
  @ApiProperty({
    enum: QuotationItemTypeEnum,
    example: QuotationItemTypeEnum.SERVICE,
    description: 'Type of line item',
  })
  @IsEnum(QuotationItemTypeEnum)
  @IsNotEmpty()
  item_type: QuotationItemTypeEnum;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description: 'Service ID (required for service items)',
  })
  @ValidateIf((o) => o.item_type === QuotationItemTypeEnum.SERVICE)
  @IsInt()
  @IsOptional()
  service_id?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    description: 'Product ID (required for material items)',
  })
  @ValidateIf((o) => o.item_type === QuotationItemTypeEnum.MATERIAL)
  @IsInt()
  @IsOptional()
  product_id?: number;

  @ApiProperty({
    type: String,
    example: 'Compressor Replacement',
    description: 'Name/title of the line item',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Replace faulty compressor with new unit',
    description: 'Description of the work/material',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Quantity',
    default: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    type: String,
    example: 'unit',
    description: 'Unit type (e.g., unit, hour, meter)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  unit_type?: string;

  @ApiProperty({
    type: Number,
    example: 5000.0,
    description: 'Price per unit',
  })
  @IsNumber()
  @Min(0)
  unit_price: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-02-01',
    description: 'Suggested schedule date for this item',
  })
  @IsString()
  @IsOptional()
  suggested_schedule_date?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Order of items in the quotation',
  })
  @IsInt()
  @IsOptional()
  sequence_order?: number;
}

/**
 * DTO for adding items to a quotation.
 */
export class AddQuotationItemsDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Quotation (quote_request) ID to add items to',
  })
  @IsInt()
  @IsNotEmpty()
  quotation_id: number;

  @ApiProperty({
    type: [CreateQuotationItemDto],
    description: 'Array of items to add',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items: CreateQuotationItemDto[];
}
