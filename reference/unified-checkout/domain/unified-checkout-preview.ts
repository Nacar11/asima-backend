import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckoutPreviewItem } from '@/sales-orders/domain/checkout-preview';

/**
 * Service checkout preview item.
 *
 * Represents a service item in the unified checkout preview.
 */
export class ServiceCheckoutPreviewItem {
  @ApiProperty({ type: Number, description: 'Cart item ID' })
  id: number;

  @ApiProperty({ type: Number, description: 'Service ID' })
  service_id: number;

  @ApiPropertyOptional({ type: Number, description: 'Service package ID' })
  package_id?: number | null;

  @ApiProperty({ type: String, description: 'Service title' })
  service_title: string;

  @ApiPropertyOptional({ type: String, description: 'Package name' })
  package_name?: string | null;

  @ApiProperty({ type: String, description: 'Scheduled date' })
  scheduled_date: string;

  @ApiProperty({ type: String, description: 'Scheduled start time' })
  scheduled_start_time: string;

  @ApiPropertyOptional({ type: String, description: 'Scheduled end time' })
  scheduled_end_time?: string | null;

  @ApiProperty({ type: Number, description: 'Quantity' })
  quantity: number;

  @ApiProperty({ type: Number, description: 'Base price (service or package)' })
  unit_price: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Total of all selected add-ons',
    default: 0,
  })
  addons_total?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Total of all option value price adjustments',
    default: 0,
  })
  options_total?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Additional fee for location',
    default: 0,
  })
  location_additional_fee?: number | null;

  @ApiProperty({
    type: Number,
    description: 'Total price (unit_price + addons + options + location fee)',
  })
  total_price: number;

  @ApiPropertyOptional({
    type: Array,
    description: 'Selected add-ons with pricing details',
  })
  selected_addons?: Array<{
    id: number;
    addon_id: number;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;

  @ApiPropertyOptional({
    type: Array,
    description: 'Selected options with pricing details',
  })
  selected_options?: Array<{
    id: number;
    option_group_id: number;
    option_value_id: number;
    group_name: string;
    value_label: string;
    quantity: number;
    price_adjustment: number;
  }>;

  @ApiProperty({ type: Boolean, description: 'Whether service is available' })
  is_available: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Reason why service is unavailable',
  })
  unavailable_reason?: string;

  @ApiPropertyOptional({ type: String, description: 'Service image URL' })
  service_image_url?: string;

  @ApiPropertyOptional({ type: Number, description: 'Seller ID' })
  seller_id?: number;

  @ApiPropertyOptional({ type: String, description: 'Seller business name' })
  seller_name?: string;
}

/**
 * Product checkout summary.
 */
export class ProductCheckoutSummary {
  @ApiProperty({ type: Number, description: 'Number of product line items' })
  line_count: number;

  @ApiProperty({
    type: Number,
    description: 'Total product item count (sum of quantities)',
  })
  item_count: number;

  @ApiProperty({ type: Number, description: 'Product subtotal amount' })
  subtotal: number;

  @ApiProperty({ type: Number, description: 'Shipping amount for products' })
  shipping_amount: number;
}

/**
 * Service checkout summary.
 */
export class ServiceCheckoutSummary {
  @ApiProperty({ type: Number, description: 'Number of service bookings' })
  booking_count: number;

  @ApiProperty({
    type: Number,
    description: 'Total base service/package prices',
  })
  base_total: number;

  @ApiProperty({ type: Number, description: 'Total add-ons amount' })
  addons_total: number;

  @ApiProperty({ type: Number, description: 'Total option adjustments amount' })
  options_total: number;

  @ApiProperty({
    type: Number,
    description: 'Total location-based additional fees',
  })
  location_fees: number;

  @ApiProperty({
    type: Number,
    description:
      'Service subtotal amount (base + addons + options + location fees)',
  })
  subtotal: number;
}

/**
 * Combined checkout summary.
 */
export class CombinedCheckoutSummary {
  @ApiProperty({ type: Number, description: 'Combined subtotal' })
  subtotal: number;

  @ApiProperty({ type: Number, description: 'Tax amount' })
  tax_amount: number;

  @ApiProperty({ type: Number, description: 'Shipping amount' })
  shipping_amount: number;

  @ApiProperty({ type: Number, description: 'Location fees' })
  location_fees: number;

  @ApiProperty({ type: Number, description: 'Grand total' })
  grand_total: number;
}

/**
 * Unified checkout preview.
 *
 * Shows both product and service items with pricing for checkout.
 */
export class UnifiedCheckoutPreview {
  @ApiProperty({
    type: Boolean,
    description: 'Whether cart can proceed to checkout',
  })
  can_checkout: boolean;

  @ApiProperty({
    type: Boolean,
    description: 'Whether cart contains product items',
  })
  has_products: boolean;

  @ApiProperty({
    type: Boolean,
    description: 'Whether cart contains service items',
  })
  has_services: boolean;

  @ApiProperty({
    type: [CheckoutPreviewItem],
    description: 'Product items in checkout',
  })
  product_items: CheckoutPreviewItem[];

  @ApiProperty({
    type: [ServiceCheckoutPreviewItem],
    description: 'Service items in checkout',
  })
  service_items: ServiceCheckoutPreviewItem[];

  @ApiProperty({
    type: ProductCheckoutSummary,
    description: 'Product summary',
  })
  product_summary: ProductCheckoutSummary;

  @ApiProperty({
    type: ServiceCheckoutSummary,
    description: 'Service summary',
  })
  service_summary: ServiceCheckoutSummary;

  @ApiProperty({
    type: CombinedCheckoutSummary,
    description: 'Combined summary',
  })
  combined_summary: CombinedCheckoutSummary;

  @ApiPropertyOptional({
    type: [String],
    description: 'Errors preventing checkout',
  })
  errors?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Warnings (non-blocking)',
  })
  warnings?: string[];
}
