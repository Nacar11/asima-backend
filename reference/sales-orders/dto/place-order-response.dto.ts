import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalesOrder } from '../domain/sales-order';

/**
 * Response DTO for place order endpoint
 * Supports multiple orders when cart contains items from different sellers
 */
export class PlaceOrderResponseDto {
  @ApiProperty({
    description: 'Array of created orders (one per seller)',
    type: [SalesOrder],
  })
  orders: SalesOrder[];

  @ApiProperty({
    description: 'Total number of orders created',
    example: 2,
  })
  order_count: number;

  @ApiProperty({
    description: 'Combined total amount across all orders',
    example: 2500.0,
  })
  total_amount: number;

  @ApiPropertyOptional({
    description: 'Gateway checkout URL for non-COD payments',
    example: 'https://payments.example.com/checkout?...',
    nullable: true,
  })
  checkout_url?: string | null;

  @ApiPropertyOptional({
    description: 'Payment transaction number for non-COD',
    example: 'PAY-20250211-1234',
    nullable: true,
  })
  payment_transaction_number?: string | null;

  @ApiPropertyOptional({
    description:
      'Created booking numbers for service items in this checkout (if any).',
    type: [String],
    example: ['BK-20260408-1699'],
    nullable: true,
  })
  booking_numbers?: string[] | null;

  constructor(
    orders: SalesOrder[],
    paymentInfo?: {
      checkout_url?: string | null;
      transaction_number?: string | null;
    },
    bookingInfo?: {
      booking_numbers?: string[] | null;
    },
  ) {
    this.orders = orders;
    this.order_count = orders.length;
    this.total_amount = orders.reduce(
      (sum, order) => sum + order.total_amount,
      0,
    );
    this.checkout_url = paymentInfo?.checkout_url ?? null;
    this.payment_transaction_number = paymentInfo?.transaction_number ?? null;
    this.booking_numbers = bookingInfo?.booking_numbers ?? null;
  }
}
