import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Causer } from '@/utils/domain/causer';

/**
 * Inventory Stock domain entity
 */
export class InventoryStock {
  @ApiProperty({
    description: 'Inventory stock ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Product variant ID (1-1 relationship)',
    example: 1,
  })
  variant_id: number;

  @ApiProperty({
    description:
      'Stock held by seller, not for public sale (private/held back inventory)',
    example: 5,
    default: 0,
  })
  stock_on_hand: number;

  @ApiProperty({
    description:
      'Total inventory count (stock_on_hand + available_quantity). This is the sum of private and public stock.',
    example: 100,
    default: 0,
  })
  stock_quantity: number;

  @ApiProperty({
    description:
      'Quantity reserved for pending orders (portion of available_quantity committed to orders)',
    example: 5,
    default: 0,
  })
  reserved_quantity: number;

  @ApiProperty({
    description:
      'Stock available for customers to purchase. Purchasable quantity = available_quantity - reserved_quantity',
    example: 95,
    default: 0,
  })
  available_quantity: number;

  @ApiProperty({
    description: 'Threshold for low stock alerts',
    example: 10,
    default: 0,
  })
  min_stock_level: number;

  @ApiProperty({
    description: 'Last stock count timestamp',
    example: '2025-11-23T00:00:00Z',
    required: false,
  })
  last_counted_at?: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-11-23T00:00:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-11-23T00:00:00Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Soft delete timestamp',
    example: '2025-11-23T00:00:00Z',
    required: false,
  })
  deleted_at?: Date;

  @ApiProperty({
    description: 'User who created this inventory stock',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      first_name: { type: 'string', example: 'John' },
      last_name: { type: 'string', example: 'Doe' },
    },
    required: false,
  })
  created_by?: Causer;

  @ApiProperty({
    description: 'User who last updated this inventory stock',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      first_name: { type: 'string', example: 'John' },
      last_name: { type: 'string', example: 'Doe' },
    },
    required: false,
  })
  updated_by?: Causer;

  @ApiProperty({
    description: 'User who deleted this inventory stock',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      first_name: { type: 'string', example: 'John' },
      last_name: { type: 'string', example: 'Doe' },
    },
    required: false,
  })
  deleted_by?: Causer;

  @Exclude()
  __entity?: string;
}
