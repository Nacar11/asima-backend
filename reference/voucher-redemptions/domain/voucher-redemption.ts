import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VoucherRedemption {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiProperty({ type: Number, example: 1 })
  user_voucher_id: number;
  @ApiProperty({ type: Number, example: 1 })
  user_id: number;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 1 })
  sales_order_id?: number | null;
  @ApiPropertyOptional({ type: Number, nullable: true, example: null })
  booking_id?: number | null;
  @ApiPropertyOptional({ type: Number, nullable: true, example: null })
  seller_id?: number | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'ORD-20260301-0001',
    description: 'Order number from the associated sales order',
  })
  order_number?: string | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'BKG-20260301-0001',
    description: 'Booking number from the associated booking',
  })
  booking_number?: string | null;
  @ApiProperty({ type: Number, example: 100 })
  discount_amount: number;
  @ApiProperty({ type: Number, example: 1000 })
  order_subtotal: number;
  @ApiProperty({ type: Date })
  redeemed_at: Date;
  @ApiProperty({ type: Date })
  created_at: Date;
  @ApiPropertyOptional({
    description:
      'Voucher summary with restriction links (joined via user_voucher)',
  })
  voucher?: {
    id: number;
    code: string;
    scope: string;
    seller_id: number | null;
    discount_type: string;
    discount_value: number;
    voucher_categories?: Array<{
      id: number;
      voucher_id: number;
      category_id: number;
      category_name: string | null;
    }>;
    voucher_products?: Array<{
      id: number;
      voucher_id: number;
      product_id: number;
      product_name: string | null;
    }>;
    voucher_services?: Array<{
      id: number;
      voucher_id: number;
      service_id: number;
      service_name: string | null;
    }>;
    voucher_service_categories?: Array<{
      id: number;
      voucher_id: number;
      service_category_id: number;
      service_category_name: string | null;
    }>;
  };
  @ApiPropertyOptional({ description: 'User summary (joined)' })
  user?: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Coffee Beans Variant A, Espresso Blend',
    description:
      'Actual product/service names from the transaction this voucher was applied to',
  })
  applied_to?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'Online' })
  channel?: string | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'My Store',
    description: 'Store name (for orders) or service title (for bookings)',
  })
  service_store_name?: string | null;
  /** Internal: order items for applied_to computation, stripped before API response */
  __order_items?: Array<{
    product_id: number | null;
    variant_name: string | null;
    service_id: number | null;
    service_name: string | null;
    service_category_id: number | null;
  }>;
}
