import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOrderItemDto {
  @ApiPropertyOptional({
    description: 'Order item ID',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiPropertyOptional({
    description: 'New quantity',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'New unit price',
    example: 99.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_price?: number;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Order notes',
    example: 'Updated notes for the order',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Shipping address',
    example: '123 Main St, City, Country',
  })
  @IsOptional()
  @IsString()
  shipping_address?: string;

  @ApiPropertyOptional({
    description: 'Order items to update',
    type: [UpdateOrderItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  items?: UpdateOrderItemDto[];

  @ApiPropertyOptional({
    description: 'Notes explaining the current status',
    example: 'Waiting for payment confirmation',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  status_notes?: string;
}
