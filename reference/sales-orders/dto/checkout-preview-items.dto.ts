import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Individual checkout item payload
 */
export class CheckoutItemDto {
  @ApiProperty({
    description: 'Cart item ID',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Item type',
    enum: ['product', 'service'],
    example: 'product',
  })
  @IsString()
  item_type: 'product' | 'service';

  @ApiProperty({
    description: 'Product variant ID (for products)',
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  variant_id?: number;

  @ApiProperty({
    description: 'Service ID (for services)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  service_id?: number;

  @ApiProperty({
    description: 'Package ID (for services)',
    example: null,
  })
  @IsOptional()
  @IsNumber()
  package_id?: number;

  @ApiProperty({
    description: 'Quantity',
    example: 1,
  })
  @IsNumber()
  quantity: number;

  @ApiProperty({
    description: 'Unit price',
    example: 720,
  })
  @IsNumber()
  unit_price: number;

  @ApiProperty({
    description: 'Total price',
    example: 720,
  })
  @IsNumber()
  total_price: number;

  @ApiProperty({
    description: 'Is item selected for checkout',
    example: true,
  })
  @IsOptional()
  is_selected?: boolean = true;
}

/**
 * DTO for checkout preview with items payload
 */
export class CheckoutPreviewItemsDto {
  @ApiProperty({
    description: 'Array of checkout items',
    type: [CheckoutItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiProperty({
    description: 'Delivery address ID for products',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  address_id?: number;

  @ApiProperty({
    description: 'Shipping method ID for products',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  shipping_method_id?: number;

  @ApiProperty({
    description: 'Voucher code to apply',
    example: 'SERVICE4DEAL',
  })
  @IsOptional()
  @IsString()
  voucher_code?: string;

  @ApiProperty({
    description: 'Array of voucher IDs',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  vouchers?: number[];
}
