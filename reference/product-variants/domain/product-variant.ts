import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Causer } from '@/utils/domain/causer';
import { Media } from '@/media/domain/media';

export class ProductVariant {
  @ApiProperty({ description: 'Product variant ID' })
  id: number;

  @ApiProperty({ description: 'Product ID' })
  product_id: number;

  @ApiProperty({ description: 'Stock Keeping Unit' })
  sku: string;

  @ApiProperty({ description: 'Variant name' })
  variant_name: string;

  @ApiPropertyOptional({ description: 'Variant description', maxLength: 500 })
  description?: string;

  @ApiProperty({ description: 'Selling price' })
  selling_price: number;

  @ApiPropertyOptional({ description: 'Cost price' })
  cost_price?: number;

  @ApiProperty({ description: 'Minimum order quantity', default: 1 })
  minimum_order: number;

  @ApiProperty({
    description: 'Display order for stable variant ordering within a product',
    default: 0,
  })
  display_order: number;

  @ApiProperty({
    description: 'Variant status',
    enum: ['Active', 'Inactive'],
    default: 'Active',
  })
  status: 'Active' | 'Inactive';

  @ApiPropertyOptional({ description: 'Media ID' })
  media_id?: number;

  @ApiPropertyOptional({
    type: () => Media,
    description: 'Media',
  })
  media?: Media | null;

  @ApiPropertyOptional({
    type: Array,
    nullable: true,
    example: [
      {
        id: 1,
        attribute_value_id: 5,
        product_attribute_id: 3,
        attribute_id: 1,
        attribute_name: 'RAM',
        value: '16GB',
      },
      {
        id: 2,
        attribute_value_id: 12,
        product_attribute_id: 4,
        attribute_id: 2,
        attribute_name: 'CPU',
        value: 'Intel i7',
      },
    ],
  })
  attribute_values?: Array<{
    id: number;
    attribute_value_id: number;
    product_attribute_id: number;
    attribute_id: number;
    attribute_name: string;
    value: string;
  }> | null;

  @ApiPropertyOptional({
    type: () => 'object',
    description: 'Inventory stock information',
    example: {
      id: 1,
      variant_id: 1,
      stock_quantity: 10,
      stock_on_hand: 10,
      reserved_quantity: 0,
      available_quantity: 10,
      min_stock_level: 5,
      last_counted_at: '2025-11-23T00:00:00Z',
    },
  })
  inventory_stock?: {
    id: number;
    variant_id: number;
    stock_quantity: number;
    stock_on_hand: number;
    reserved_quantity: number;
    available_quantity: number;
    min_stock_level: number;
    last_counted_at?: Date;
  } | null;

  @ApiPropertyOptional({
    type: () => 'object',
    description: 'User who created this record',
  })
  created_by?: Causer;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => 'object',
    description: 'User who last updated this record',
  })
  updated_by?: Causer;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => 'object',
    description: 'User who deleted this record',
  })
  deleted_by?: Causer;

  @ApiPropertyOptional({ description: 'Deletion timestamp' })
  deleted_at?: Date;

  @Exclude()
  __entity?: string;
}
