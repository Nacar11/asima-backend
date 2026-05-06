import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckoutOrder } from '@/checkout-orders/domain/checkout-order';
import { SalesOrder } from '@/sales-orders/domain/sales-order';
import { Booking } from '@/bookings/domain/booking';

/**
 * Unified checkout summary.
 */
export class UnifiedCheckoutSummary {
  @ApiProperty({ type: Number, description: 'Number of products purchased' })
  total_products: number;

  @ApiProperty({ type: Number, description: 'Number of services booked' })
  total_services: number;

  @ApiProperty({ type: Number, description: 'Product subtotal' })
  product_subtotal: number;

  @ApiProperty({ type: Number, description: 'Service subtotal' })
  service_subtotal: number;

  @ApiProperty({ type: Number, description: 'Shipping total' })
  shipping_total: number;

  @ApiProperty({ type: Number, description: 'Tax total' })
  tax_total: number;

  @ApiProperty({ type: Number, description: 'Location fees total' })
  location_fees_total: number;

  @ApiProperty({ type: Number, description: 'Grand total' })
  grand_total: number;
}

/**
 * Unified checkout result.
 *
 * Result of processing a unified checkout containing both products and services.
 */
export class UnifiedCheckoutResult {
  @ApiProperty({
    type: () => CheckoutOrder,
    description: 'The checkout order created',
  })
  checkout_order: CheckoutOrder;

  @ApiPropertyOptional({
    type: () => SalesOrder,
    description: 'Sales order created for products (if cart had products)',
  })
  sales_order?: SalesOrder;

  @ApiPropertyOptional({
    type: [Booking],
    description: 'Bookings created for services (if cart had services)',
  })
  bookings?: Booking[];

  @ApiProperty({
    type: UnifiedCheckoutSummary,
    description: 'Summary of the checkout',
  })
  summary: UnifiedCheckoutSummary;
}
