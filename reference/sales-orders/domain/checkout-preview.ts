import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingRateResponseDto } from '@/shipping/dto/shipping-rate-response.dto';
import { Voucher } from '@/vouchers/domain/voucher';

/**
 * Seller pickup info for checkout display
 */
export class SellerPickupInfo {
  @ApiProperty({ description: 'Seller ID', example: 1 })
  seller_id: number;

  @ApiProperty({ description: 'Seller store name', example: 'My Store' })
  name: string;

  @ApiPropertyOptional({
    description: 'Seller contact/phone number',
    example: '+63 912 345 6789',
  })
  phone?: string | null;

  @ApiPropertyOptional({
    description: 'Pickup address line 1',
    example: '123 Pickup St',
  })
  address?: string | null;

  @ApiPropertyOptional({
    description: 'Latitude coordinate for pickup location',
    example: 14.5995,
  })
  latitude?: number | null;

  @ApiPropertyOptional({
    description: 'Longitude coordinate for pickup location',
    example: 120.9842,
  })
  longitude?: number | null;

  @ApiProperty({
    description: 'Preparation time in minutes before pickup is ready',
    example: 15,
  })
  pickup_preparation_time: number;

  @ApiPropertyOptional({
    description: 'Pickup instructions for customers',
    example: 'Go to the back entrance',
  })
  pickup_instructions?: string | null;

  @ApiProperty({
    description: 'Whether pickup is enabled for this seller',
    example: true,
  })
  pickup_enabled: boolean;
}

/**
 * Checkout preview item with validation status
 */
export class CheckoutPreviewItem {
  @ApiProperty({
    description: 'Cart item ID',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'Product variant ID (for product items)',
    example: 1,
  })
  variant_id?: number;

  @ApiPropertyOptional({
    description: 'Variant name (for product items)',
    example: 'iPhone 15 Blue 128GB',
  })
  variant_name?: string;

  @ApiPropertyOptional({
    description: 'Product name (for product items)',
    example: 'iPhone 15',
  })
  product_name?: string;

  @ApiPropertyOptional({
    description: 'SKU (for product items)',
    example: 'IPHONE-15-BLUE-128GB',
  })
  sku?: string;

  @ApiPropertyOptional({
    description: 'Service ID (for service items)',
    example: 10,
  })
  service_id?: number;

  @ApiPropertyOptional({
    description: 'Service name (for service items)',
    example: 'Aircon Cleaning',
  })
  service_name?: string;

  @ApiPropertyOptional({
    description: 'Service package ID (for service items)',
    example: 3,
  })
  package_id?: number;

  @ApiPropertyOptional({
    description: 'Item type (product or service)',
    example: 'product',
    enum: ['product', 'service'],
  })
  item_type?: 'product' | 'service';

  @ApiProperty({
    description: 'Quantity',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit price at current time',
    example: 999.0,
  })
  unit_price: number;

  @ApiProperty({
    description: 'Total price (unit_price * quantity)',
    example: 1998.0,
  })
  total_price: number;

  @ApiProperty({
    description: 'Whether this item is available for purchase',
    example: true,
  })
  is_available: boolean;

  @ApiPropertyOptional({
    description: 'Reason if item is unavailable',
    example: 'Insufficient stock',
  })
  unavailable_reason?: string;

  @ApiPropertyOptional({
    description: 'Product image URL (primary product image)',
    example: 'products/12345/compressed/image.jpg',
  })
  product_image_url?: string;

  @ApiPropertyOptional({
    description:
      'Variant image URL (variant-specific image, takes precedence over product image)',
    example: 'products/12345/variants/67890/compressed/image.jpg',
  })
  variant_image_url?: string;

  @ApiPropertyOptional({
    description: 'Service image URL (for service items)',
    example: 'services/12345/compressed/image.jpg',
  })
  service_image_url?: string;

  @ApiPropertyOptional({
    description: 'Seller ID this item belongs to',
    example: 1,
  })
  seller_id?: number | null;
}

/**
 * Checkout preview summary
 */
export class CheckoutPreviewSummary {
  @ApiProperty({
    description: 'Number of line items (distinct products)',
    example: 2,
  })
  line_count: number;

  @ApiProperty({
    description: 'Total quantity of all items (sum of quantities)',
    example: 5,
  })
  item_count: number;

  @ApiProperty({
    description: 'Subtotal (sum of all item prices)',
    example: 2500.0,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Tax amount',
    example: 0,
  })
  tax_amount: number;

  @ApiProperty({
    description: 'Shipping amount',
    example: 0,
  })
  shipping_amount: number;

  @ApiProperty({
    description: 'Total amount (subtotal + tax + shipping - discounts)',
    example: 2500.0,
  })
  total_amount: number;

  @ApiPropertyOptional({
    description: 'Item discount amount from vouchers',
    example: 100.0,
  })
  item_discount_amount?: number;

  @ApiPropertyOptional({
    description: 'Shipping discount amount from vouchers',
    example: 50.0,
  })
  shipping_discount_amount?: number;
}

/**
 * Checkout preview response
 * Shows cart summary and item availability before placing order
 */
export class CheckoutPreview {
  @ApiProperty({
    description: 'Whether all items are available and checkout can proceed',
    example: true,
  })
  can_checkout: boolean;

  @ApiProperty({
    description: 'Preview items with availability status',
    type: [CheckoutPreviewItem],
  })
  items: CheckoutPreviewItem[];

  @ApiProperty({
    description: 'Order summary',
    type: CheckoutPreviewSummary,
  })
  summary: CheckoutPreviewSummary;

  @ApiPropertyOptional({
    description:
      'Whether the current checkout qualifies for free shipping. Present when shipping could be calculated.',
    type: Boolean,
    example: false,
  })
  is_free_shipping?: boolean;

  @ApiPropertyOptional({
    description:
      'Shipping calculation result (preview only). Present when shipping could be calculated.',
    type: ShippingRateResponseDto,
  })
  shipping?: ShippingRateResponseDto;

  @ApiPropertyOptional({
    description:
      'Seller pickup info keyed by seller_id. Includes name, address, phone, coordinates, preparation time, instructions, and pickup_enabled flag.',
    type: [SellerPickupInfo],
  })
  sellers?: SellerPickupInfo[];

  @ApiPropertyOptional({
    description: 'Validation errors if any items are unavailable',
    type: [String],
    example: ['Insufficient stock for iPhone 15 Blue 128GB'],
  })
  errors?: string[];

  @ApiPropertyOptional({
    description:
      'Single voucher object applied during checkout preview (from vouchers or voucher_code).',
    type: Voucher,
  })
  applied_voucher?: Voucher;
}
