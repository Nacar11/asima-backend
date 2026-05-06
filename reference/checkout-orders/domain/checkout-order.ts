import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { CheckoutStatusEnum } from '@/checkout-orders/enums/checkout-status.enum';
import { PaymentStatusEnum } from '@/checkout-orders/enums/payment-status.enum';

/**
 * Checkout Order domain model.
 *
 * Represents a unified checkout order that can contain both products and services.
 * Created from a shopping cart at checkout. Tracks order status, payment status,
 * totals, and addresses for delivery/service.
 *
 * @version 1
 * @since 1.0.0
 */
export class CheckoutOrder {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Checkout order ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'User ID who placed this order',
  })
  user_id: number;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who placed this order',
  })
  user?: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>;

  @ApiProperty({
    type: String,
    example: 'ORD-20241211-1234',
    description: 'Unique order number (format: ORD-YYYYMMDD-XXXX)',
  })
  order_number: string;

  // Order Contents
  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether this order contains products',
    default: false,
  })
  has_products: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether this order contains services',
    default: false,
  })
  has_services: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether this order contains bundles',
    default: false,
  })
  has_bundles: boolean;

  // Totals
  @ApiProperty({
    type: Number,
    example: 5000.0,
    description: 'Subtotal before discounts, taxes, and fees',
  })
  subtotal: number;

  @ApiProperty({
    type: Number,
    example: 0.0,
    description: 'Total discount amount',
    default: 0,
  })
  discount_total: number;

  @ApiProperty({
    type: Number,
    example: 100.0,
    description: 'Total shipping cost',
    default: 0,
  })
  shipping_total: number;

  @ApiProperty({
    type: Number,
    example: 600.0,
    description: 'Total tax amount',
    default: 0,
  })
  tax_total: number;

  @ApiProperty({
    type: Number,
    example: 250.0,
    description: 'Total platform fee',
    default: 0,
  })
  platform_fee_total: number;

  @ApiProperty({
    type: Number,
    example: 5950.0,
    description:
      'Grand total (subtotal + shipping + tax + platform_fee - discount)',
  })
  grand_total: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Currency ID',
    nullable: true,
  })
  currency_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Currency details',
    nullable: true,
  })
  currency?: any;

  // Status
  @ApiProperty({
    enum: CheckoutStatusEnum,
    example: CheckoutStatusEnum.PENDING,
    description: 'Checkout order status',
    default: CheckoutStatusEnum.PENDING,
  })
  status: CheckoutStatusEnum;

  @ApiProperty({
    enum: PaymentStatusEnum,
    example: PaymentStatusEnum.PENDING,
    description: 'Payment status',
    default: PaymentStatusEnum.PENDING,
  })
  payment_status: PaymentStatusEnum;

  // Delivery Address (for products)
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Delivery address ID for product orders',
    nullable: true,
  })
  delivery_address_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Delivery address details',
    nullable: true,
  })
  delivery_address?: any;

  // Service Address (for services)
  @ApiPropertyOptional({
    type: Number,
    example: 2,
    description: 'Service address ID for service orders',
    nullable: true,
  })
  service_address_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Service address details',
    nullable: true,
  })
  service_address?: any;

  // Notes
  @ApiPropertyOptional({
    type: String,
    example: 'Please leave at the front door',
    description: 'Customer notes for this order',
    nullable: true,
  })
  customer_notes?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'VIP customer - expedite processing',
    description: 'Internal notes (admin only)',
    nullable: true,
  })
  internal_notes?: string | null;

  // Timestamps
  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-11T10:30:00Z',
    description: 'Timestamp when payment was completed',
    nullable: true,
  })
  paid_at?: Date | null;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-15T14:00:00Z',
    description: 'Timestamp when order was completed',
    nullable: true,
  })
  completed_at?: Date | null;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'Timestamp when order was cancelled',
    nullable: true,
  })
  cancelled_at?: Date | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Customer requested cancellation',
    description: 'Reason for cancellation',
    nullable: true,
  })
  cancellation_reason?: string | null;

  // Source
  @ApiProperty({
    type: String,
    example: 'mobile_app',
    description: 'Source of the order (mobile_app, web_app, etc.)',
    default: 'mobile_app',
  })
  source: string;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this checkout order',
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'Creation timestamp',
  })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who last updated this checkout order',
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:05:00Z',
    description: 'Last update timestamp',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who deleted this checkout order',
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'Deletion timestamp (null if not deleted)',
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
