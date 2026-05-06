import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductVariantDto } from './create-product-variant.dto';

export class SyncProductVariantsDto {
  @ApiProperty({
    description:
      'Array of product variants that will replace existing variants for the product',
    type: [CreateProductVariantDto],
    example: [
      {
        sku: 'IPHONE-15-BLUE-128GB',
        variant_name: 'iPhone 15 Blue 128GB',
        description: 'Blue iPhone 15 with 128GB storage',
        selling_price: 999,
        cost_price: 799,
        minimum_order: 1,
        status: 'Active',
        media_id: 1,
        attribute_value_ids: [1, 3],
        stock_quantity: 50,
        reserved_quantity: 2,
        available_quantity: 48,
      },
      {
        sku: 'IPHONE-15-BLUE-256GB',
        variant_name: 'iPhone 15 Blue 256GB',
        description: 'Blue iPhone 15 with 256GB storage',
        selling_price: 1099,
        cost_price: 899,
        minimum_order: 1,
        status: 'Active',
        media_id: 1,
        attribute_value_ids: [1, 4],
        stock_quantity: 30,
        reserved_quantity: 0,
        available_quantity: 30,
      },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  product_variants: CreateProductVariantDto[];
}
