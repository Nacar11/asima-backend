import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Causer } from '@/utils/domain/causer';
import { OrderStatusEnum } from './order-status.enum';
import { SalesOrderItem } from './sales-order-item';
import { OrderTrackingEvent } from '@/order-tracking/domain/order-tracking-event';
import { SalesOrderVoucher } from '@/sales-order-vouchers/domain/sales-order-voucher';

/**
 * Sales Order domain entity
 * Represents a customer order created from shopping cart checkout
 */
export class SalesOrder {
  @ApiProperty({
    description: 'Order ID',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'Invoice ID (if invoice exists for this order)',
    example: 1,
    nullable: true,
  })
  invoice_id?: number | null;

  @ApiProperty({
    description: 'User ID (buyer)',
    example: 1,
  })
  user_id: number;

  @ApiPropertyOptional({
    description: 'Seller ID (store owner)',
    example: 1,
  })
  seller_id?: number | null;

  @ApiPropertyOptional({
    description: 'Seller details',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      store_name: { type: 'string', example: 'My Store' },
      pickup_address: {
        type: 'string',
        example: 'IT Park, Apas, Cebu City',
        nullable: true,
      },
      pickup_latitude: { type: 'number', example: 10.3297, nullable: true },
      pickup_longitude: { type: 'number', example: 123.9054, nullable: true },
      phone: { type: 'string', example: '+639171234567', nullable: true },
    },
  })
  seller?: {
    id: number;
    store_name: string;
    pickup_address?: string | null;
    pickup_latitude?: number | null;
    pickup_longitude?: number | null;
    phone?: string | null;
  };

  @ApiPropertyOptional({
    description: 'User details',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      first_name: { type: 'string', example: 'John' },
      last_name: { type: 'string', example: 'Doe' },
      email: { type: 'string', example: 'john@example.com' },
    },
  })
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Unique order number',
    example: 'ORD-M5K8P2Q3-A7B9',
  })
  order_number: string;

  @Exclude()
  idempotency_key?: string | null;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatusEnum,
    example: OrderStatusEnum.PENDING,
  })
  status: OrderStatusEnum;

  @ApiPropertyOptional({
    description: 'Notes explaining the current status',
    example: 'Waiting for payment confirmation',
  })
  status_notes?: string | null;

  @ApiProperty({
    description: 'Subtotal (sum of all item prices)',
    example: 1500.0,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Tax amount',
    example: 0,
    default: 0,
  })
  tax_amount: number;

  @ApiProperty({
    description: 'Shipping amount',
    example: 0,
    default: 0,
  })
  shipping_amount: number;

  @ApiProperty({
    description: 'Total amount (subtotal + tax + shipping)',
    example: 1500.0,
  })
  total_amount: number;

  @ApiProperty({
    description: 'Commission rate snapshot at order placement time',
    example: 10,
    default: 0,
  })
  commission_rate: number;

  @ApiPropertyOptional({
    description: 'Order notes from customer',
    example: 'Please handle with care',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Shipping address (legacy text field)',
    example: '123 Main St, City, Country',
  })
  shipping_address?: string | null;

  // Shipping address snapshot fields (per e-commerce address architecture PRD)
  @ApiPropertyOptional({
    description: 'Reference to original user address (for tracking only)',
    example: 1,
  })
  user_address_id?: number | null;

  @ApiPropertyOptional({
    description: 'Snapshot: recipient name at time of order',
    example: 'Juan Dela Cruz',
  })
  shipping_recipient_name?: string | null;

  @ApiPropertyOptional({
    description: 'Snapshot: contact phone at time of order',
    example: '+639171234567',
  })
  shipping_phone?: string | null;

  @ApiPropertyOptional({
    description: 'Snapshot: street address at time of order',
    example: '123 Rizal Street',
  })
  shipping_address_line1?: string | null;

  @ApiPropertyOptional({
    description: 'Snapshot: apt/suite/unit at time of order',
    example: 'Unit 5B',
  })
  shipping_address_line2?: string | null;

  @ApiPropertyOptional({
    description: 'Snapshot: city at time of order',
    example: 'Makati City',
  })
  shipping_city?: string | null;

  @ApiPropertyOptional({
    description: 'Snapshot: state/province at time of order',
    example: 'Metro Manila',
  })
  shipping_state_province?: string | null;

  @ApiPropertyOptional({
    description: 'Snapshot: postal code at time of order',
    example: '1234',
  })
  shipping_postal_code?: string | null;

  @ApiPropertyOptional({
    description: 'Snapshot: country at time of order',
    example: 'Philippines',
  })
  shipping_country?: string | null;

  @ApiPropertyOptional({
    description: 'Shipping method selected by customer',
    example: 'Standard Delivery',
  })
  shipping_method?: string | null;

  @ApiPropertyOptional({
    description: 'Tracking number for shipment',
    example: 'TRK123456789',
  })
  tracking_number?: string | null;

  @ApiPropertyOptional({
    description: 'Shipping provider name',
    example: 'FedEx',
  })
  shipping_provider?: string | null;

  @ApiPropertyOptional({
    description: 'Date when order was shipped',
    example: '2025-11-25T10:00:00Z',
  })
  shipped_at?: Date | null;

  @ApiPropertyOptional({
    description: 'Date when order was delivered',
    example: '2025-11-28T14:00:00Z',
  })
  delivered_at?: Date | null;

  @ApiPropertyOptional({
    description: 'Date when order was completed (customer confirmed receipt)',
    example: '2025-12-01T10:00:00Z',
  })
  completed_at?: Date | null;

  @ApiPropertyOptional({
    description: 'Review ID attached to this completed order',
    example: 10,
  })
  review_id?: number | null;

  @ApiPropertyOptional({
    description: 'Timestamp when the order was reviewed',
    example: '2025-12-02T10:00:00Z',
  })
  reviewed_at?: Date | null;

  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Customer requested cancellation',
  })
  cancellation_reason?: string | null;

  @ApiPropertyOptional({
    description: 'Date when order was cancelled',
    example: '2025-11-24T09:00:00Z',
  })
  cancelled_at?: Date | null;

  // ==================== Payment Fields ====================

  @ApiPropertyOptional({
    description: 'Payment method code (e.g., cod, gcash, maya)',
    example: 'gcash',
  })
  payment_method?: string | null;

  @ApiProperty({
    description: 'Payment status',
    example: 'pending',
    default: 'pending',
  })
  payment_status: string;

  // ==================== End Payment Fields ====================

  // ==================== MEPF Flow Fields ====================

  @ApiPropertyOptional({
    description:
      'FK to quote_requests table. The quotation this order was created from.',
    example: 5,
    nullable: true,
  })
  source_quotation_id?: number | null;

  // ==================== End MEPF Flow Fields ====================

  // ==================== Checkout Source ====================

  @ApiPropertyOptional({
    description:
      'Platform source that originated this order (e.g. ekumpra, etravajoe)',
    example: 'ekumpra',
    nullable: true,
  })
  checkout_source?: string | null;

  // ==================== End Checkout Source ====================

  // ==================== Pickup Fulfillment ====================

  @ApiProperty({
    description: 'Fulfillment type: delivery or pickup',
    example: 'delivery',
    default: 'delivery',
  })
  fulfillment_type: string;

  @ApiPropertyOptional({
    description: 'Scheduled pickup date',
    example: '2025-12-01',
    nullable: true,
  })
  pickup_date?: Date | null;

  @ApiPropertyOptional({
    description: 'Scheduled pickup time (HH:MM)',
    example: '10:00',
    nullable: true,
  })
  pickup_time?: string | null;

  @ApiPropertyOptional({
    description: 'Pickup notes from customer',
    example: 'Call upon arrival',
    nullable: true,
  })
  pickup_notes?: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp when order was marked ready for pickup',
    example: '2025-12-01T09:30:00Z',
    nullable: true,
  })
  ready_for_pickup_at?: Date | null;

  @ApiPropertyOptional({
    description: 'Timestamp when customer picked up the order',
    example: '2025-12-01T10:05:00Z',
    nullable: true,
  })
  picked_up_at?: Date | null;

  @ApiPropertyOptional({
    description: 'Timestamp when pickup reminder was sent',
    nullable: true,
  })
  pickup_reminder_notified_at?: Date | null;

  @ApiPropertyOptional({
    description: 'Timestamp when first no-show warning was sent',
    nullable: true,
  })
  noshow_warning_1_notified_at?: Date | null;

  @ApiPropertyOptional({
    description: 'Timestamp when second no-show warning was sent',
    nullable: true,
  })
  noshow_warning_2_notified_at?: Date | null;

  @ApiPropertyOptional({
    description: 'Extended grace period in minutes',
    example: 30,
    nullable: true,
  })
  grace_period_extension?: number | null;

  @ApiPropertyOptional({
    description:
      'Confirmation code the customer presents when collecting a pickup order. Generated when order is marked ready_for_pickup.',
    example: 'PK3F',
    nullable: true,
  })
  pickup_confirmation_code?: string | null;

  // ==================== End Pickup Fulfillment ====================

  @ApiPropertyOptional({
    description: 'Order items',
    type: [SalesOrderItem],
  })
  items?: SalesOrderItem[];

  @ApiPropertyOptional({
    description: 'Voucher applied to this order',
    type: SalesOrderVoucher,
  })
  voucher?: SalesOrderVoucher | null;

  @ApiPropertyOptional({
    description: 'All vouchers applied to this order',
    type: [SalesOrderVoucher],
  })
  sales_order_vouchers?: SalesOrderVoucher[];

  @ApiPropertyOptional({
    description: 'Order tracking events timeline',
    type: [OrderTrackingEvent],
  })
  tracking_events?: OrderTrackingEvent[];

  @ApiPropertyOptional({
    description: 'User who created this order',
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
    description: 'User who last updated this order',
    type: 'object',
  })
  updated_by?: Causer;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-11-23T00:00:00Z',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'User who deleted this order',
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
