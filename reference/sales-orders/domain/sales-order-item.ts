import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Causer } from '@/utils/domain/causer';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { Media } from '@/media/domain/media';

/**
 * Sales Order Item domain entity
 * Represents a line item in an order with price snapshot at checkout time.
 * Supports both product items (with variant_id) and service items (with service_id).
 *
 * @version 2
 * @since 1.0.0
 */
export class SalesOrderItem {
  @ApiProperty({
    description: 'Order item ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Sales order ID',
    example: 1,
  })
  order_id: number;

  @ApiProperty({
    description: 'Item type: product or service',
    enum: CartItemTypeEnum,
    example: CartItemTypeEnum.PRODUCT,
  })
  item_type: CartItemTypeEnum;

  @ApiPropertyOptional({
    description: 'Product variant ID (required for product items)',
    example: 5,
  })
  variant_id?: number | null;

  @ApiPropertyOptional({
    description: 'Product variant details',
    type: 'object',
    properties: {
      id: { type: 'number', example: 5 },
      sku: { type: 'string', example: 'SKU-001' },
      variant_name: { type: 'string', example: 'Large - Red' },
      variant_image_url: {
        type: 'string',
        example: 'products/12345/variants/image.jpg',
      },
      product: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          product_name: { type: 'string', example: 'T-Shirt' },
          product_image_url: {
            type: 'string',
            example: 'products/12345/image.jpg',
          },
        },
      },
    },
  })
  variant?: {
    id: number;
    sku: string;
    variant_name: string;
    variant_image_url?: string | null;
    media?: Media | null;
    url?: string | null;
    product?: {
      id: number;
      product_name: string;
      product_image_url?: string | null;
    };
  } | null;

  @ApiPropertyOptional({
    description: 'Service ID (required for service items)',
    example: 10,
  })
  service_id?: number | null;

  @ApiPropertyOptional({
    description: 'Service details',
    type: 'object',
  })
  service?: {
    id: number;
    title: string;
    short_description?: string | null;
    seller?: {
      id: number;
      store_name?: string | null;
    };
  } | null;

  @ApiPropertyOptional({
    description: 'Service package ID (optional, for service items)',
    example: 3,
  })
  package_id?: number | null;

  @ApiPropertyOptional({
    description: 'Scheduled date for service (for service items)',
    type: Date,
    example: '2024-12-25',
  })
  scheduled_date?: Date | null;

  @ApiPropertyOptional({
    description: 'Scheduled start time for service (for service items)',
    example: '09:00:00',
  })
  scheduled_start_time?: string | null;

  @ApiPropertyOptional({
    description: 'Service address ID (for service items)',
    example: 5,
  })
  service_address_id?: number | null;

  @ApiPropertyOptional({
    description: 'Special requests or instructions for the service',
    example: 'Please bring extra cleaning supplies',
  })
  special_requests?: string | null;

  @ApiPropertyOptional({
    description: 'Location-based additional fee for service',
    example: 50.0,
  })
  location_additional_fee?: number | null;

  @ApiProperty({
    description: 'Quantity ordered',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit price at time of purchase (price snapshot)',
    example: 499.99,
  })
  unit_price: number;

  @ApiProperty({
    description: 'Total price (quantity * unit_price)',
    example: 999.98,
  })
  total_price: number;

  @ApiPropertyOptional({
    description:
      'Review ID if this item has been reviewed (derived from reviews relation)',
    example: 42,
    nullable: true,
  })
  review_id?: number | null;

  // ==================== MEPF Flow Fields ====================

  @ApiPropertyOptional({
    description:
      'FK to quote_requests table. The quotation this item was created from.',
    example: 5,
    nullable: true,
  })
  source_quotation_id?: number | null;

  @ApiPropertyOptional({
    description:
      'FK to quotation_items table. The specific quotation line item this was created from.',
    example: 12,
    nullable: true,
  })
  source_quotation_item_id?: number | null;

  // ==================== End MEPF Flow Fields ====================

  @ApiPropertyOptional({
    description: 'Service package details (for service items)',
    type: 'object',
  })
  package?: {
    id: number;
    name: string;
    description?: string | null;
    base_price: number;
    base_duration_minutes: number;
  } | null;

  @ApiPropertyOptional({
    description: 'Service address snapshot (for service items)',
    type: 'object',
  })
  service_address?: {
    id: number;
    recipient_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state_province: string;
    postal_code: string;
    country: string;
    full_address: string;
  } | null;

  @ApiPropertyOptional({
    description: 'Service add-ons (for service items)',
    type: 'array',
  })
  addons?: Array<{
    id: number;
    addon_id: number | null;
    addon_name: string;
    addon_code: string;
    addon_description?: string | null;
    unit_type?: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    duration_minutes?: number | null;
  }> | null;

  @ApiPropertyOptional({
    description: 'Service options (for service items)',
    type: 'array',
  })
  options?: Array<{
    id: number;
    option_group_id: number | null;
    option_value_id: number | null;
    group_name: string;
    group_code: string;
    value_label: string;
    value_code: string;
    quantity: number;
    price_adjustment: number;
    duration_adjustment_minutes: number;
  }> | null;

  @ApiPropertyOptional({
    description: 'User who created this item',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      first_name: { type: 'string', example: 'John' },
      last_name: { type: 'string', example: 'Doe' },
    },
  })
  created_by?: Causer;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-11-23T00:00:00Z',
  })
  created_at: Date;

  @ApiPropertyOptional({
    description: 'User who last updated this item',
    type: 'object',
  })
  updated_by?: Causer;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-11-23T00:00:00Z',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'User who deleted this item',
    type: 'object',
  })
  deleted_by?: Causer;

  @ApiPropertyOptional({
    description: 'Soft delete timestamp',
    example: null,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
