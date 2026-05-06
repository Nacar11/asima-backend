import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';

/**
 * Shopping cart item domain model.
 *
 * Represents a single item in a shopping cart. Can be either a product variant
 * (for products) or a service/package (for services). Includes quantity, pricing
 * information, and scheduling details for service items. Tracks audit information.
 *
 * @version 2
 * @since 1.0.0
 */
export class ShoppingCartItem {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Shopping cart item ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Shopping cart ID this item belongs to',
  })
  shopping_cart_id: number;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description: 'Product variant ID (required for product items)',
    nullable: true,
  })
  variant_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description:
      'Full product variant details including product, images, and inventory stock',
    example: {
      id: 5,
      sku: 'SKU-001',
      variant_name: 'Blue Shirt - Medium',
      selling_price: 499.99,
      cost_price: 250.0,
      minimum_order: 1,
      status: 'Active',
      variant_image_url: 'https://example.com/variant.jpg',
      inventory_stock: {
        available_quantity: 100,
        reserved_quantity: 5,
        stock_quantity: 150,
      },
      product: {
        id: 1,
        product_name: 'Blue Shirt',
        description: 'A stylish blue shirt',
        status: 'Active',
        product_image_url: 'https://example.com/product.jpg',
        seller_id: 1,
        store_name: 'Tech Store',
      },
    },
  })
  variant?: any;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    description: 'Service ID (required for service items)',
    nullable: true,
  })
  service_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 3,
    description: 'Service package ID (optional for service items)',
    nullable: true,
  })
  package_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Full service details',
  })
  service?: any;

  @ApiPropertyOptional({
    type: Object,
    description: 'Full service package details',
  })
  package?: any;

  @ApiProperty({
    enum: CartItemTypeEnum,
    example: CartItemTypeEnum.PRODUCT,
    description: 'Type of cart item (product or service)',
    default: CartItemTypeEnum.PRODUCT,
  })
  item_type: CartItemTypeEnum;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-25',
    description: 'Scheduled date for service (required for service items)',
    nullable: true,
  })
  scheduled_date?: Date | null;

  @ApiPropertyOptional({
    type: String,
    example: '09:00:00',
    description:
      'Scheduled start time for service (required for service items)',
    nullable: true,
  })
  scheduled_start_time?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '11:00:00',
    description:
      'Scheduled end time for venue services (customer-selected end time)',
    nullable: true,
  })
  scheduled_end_time?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Address ID where service will be performed',
    nullable: true,
  })
  service_address_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Full address details for service location',
  })
  service_address?: any;

  @ApiPropertyOptional({
    type: String,
    example: 'Please bring extra cleaning supplies',
    description: 'Special requests or instructions for the service',
    nullable: true,
  })
  special_requests?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'walk_in',
    description: 'Appointment location type (walk_in, home_service, remote)',
    nullable: true,
  })
  appointment_location_type?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      'Form submission ID for service requirements filled by customer',
    nullable: true,
  })
  form_submission_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Form submission details for service requirements',
  })
  form_submission?: any;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Quantity of this item in the cart',
  })
  quantity: number;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether this item is selected for checkout',
    default: false,
  })
  is_selected: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    description:
      'Additional fee based on service location (from service area coverage check)',
    nullable: true,
    default: 0,
  })
  location_additional_fee?: number | null;

  @ApiProperty({
    type: Number,
    example: 499.99,
    description: 'Unit price of the variant (cached for performance)',
  })
  unit_price?: number;

  @ApiProperty({
    type: Number,
    example: 999.98,
    description: 'Total price (quantity * unit_price)',
  })
  total_price?: number;

  @ApiPropertyOptional({
    type: Array,
    description:
      'Selected add-ons for this cart item with pricing and duration information',
  })
  selected_addons?: Array<{
    id: number;
    addon_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    /** Duration in minutes for this addon (for client-side duration calculation) */
    duration_minutes?: number | null;
    addon?: {
      id: number;
      name: string;
      description?: string;
      /** Duration in minutes for this addon */
      duration_minutes?: number | null;
    };
  }>;

  @ApiPropertyOptional({
    type: Array,
    description: 'Selected options for this cart item with pricing information',
  })
  selected_options?: Array<{
    id: number;
    option_group_id: number;
    option_value_id: number;
    quantity: number;
    price_adjustment: number;
    duration_adjustment_minutes: number;
    option_group?: {
      id: number;
      name: string;
    };
    option_value?: {
      id: number;
      name: string;
    };
  }>;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this cart item',
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-01-01T00:00:00Z',
    description: 'Creation timestamp',
  })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who last updated this cart item',
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-01-01T00:00:00Z',
    description: 'Last update timestamp',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who deleted this cart item',
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'Deletion timestamp (null if not deleted)',
  })
  deleted_at?: Date | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Only 2 items left in stock',
    description: 'Stock or validation warning message, if any',
    nullable: true,
  })
  warning?: string;

  @Exclude()
  __entity?: string;
}
