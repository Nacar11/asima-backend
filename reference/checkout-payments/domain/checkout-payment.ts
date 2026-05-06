import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { CheckoutPaymentStatusEnum } from '../enums/checkout-payment-status.enum';

/**
 * Checkout Payment domain model.
 *
 * Represents a payment transaction for a checkout order. Tracks payment status,
 * gateway details, amounts, refunds, and chargebacks.
 *
 * @version 1
 * @since 1.0.0
 */
export class CheckoutPayment {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Checkout payment ID',
  })
  id: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Checkout order ID this payment belongs to',
    nullable: true,
  })
  checkout_order_id: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Checkout order details',
  })
  checkout_order?: any;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Sales order ID this payment belongs to',
    nullable: true,
  })
  sales_order_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Sales order details',
  })
  sales_order?: any;

  @ApiProperty({
    type: String,
    example: 'PAY-20241211-1234',
    description: 'Unique transaction number (format: PAY-YYYYMMDD-XXXX)',
    nullable: true,
  })
  transaction_number?: string | null;

  @ApiProperty({
    type: String,
    example: 'gcash',
    description: 'Payment method code (gcash, credit_card, cod)',
  })
  payment_method_code: string;

  @ApiProperty({
    type: String,
    example: 'paymongo',
    description: 'Payment gateway used',
    default: 'paymongo',
  })
  payment_gateway: string;

  @ApiPropertyOptional({
    type: String,
    example: 'pay_abc123xyz',
    description: 'Gateway transaction ID from PayMongo',
    nullable: true,
  })
  gateway_transaction_id?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'REF123456',
    description: 'Gateway reference number',
    nullable: true,
  })
  gateway_reference_number?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://pay.paymongo.com/checkout/abc123',
    description: 'Gateway checkout URL for redirect-based payments',
    nullable: true,
  })
  gateway_checkout_url?: string | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Full gateway response (JSON)',
    nullable: true,
  })
  gateway_response?: any | null;

  @ApiProperty({
    type: String,
    example: 'full',
    description: 'Payment type (full, partial, installment)',
    default: 'full',
  })
  payment_type: string;

  @ApiPropertyOptional({
    type: Number,
    example: null,
    description: 'Installment ID if this is an installment payment',
    nullable: true,
  })
  installment_id?: number | null;

  @ApiProperty({
    type: Number,
    example: 5000.0,
    description: 'Payment amount',
  })
  amount: number;

  @ApiProperty({
    type: Number,
    example: 50.0,
    description: 'Gateway processing fee',
    default: 0,
  })
  gateway_fee: number;

  @ApiPropertyOptional({
    type: Number,
    example: 4950.0,
    description: 'Net amount after gateway fees',
    nullable: true,
  })
  net_amount?: number | null;

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
  currency?: any | null;

  @ApiProperty({
    enum: CheckoutPaymentStatusEnum,
    example: CheckoutPaymentStatusEnum.PENDING,
    description: 'Payment status',
    default: CheckoutPaymentStatusEnum.PENDING,
  })
  status: CheckoutPaymentStatusEnum;

  @ApiPropertyOptional({
    type: String,
    example: null,
    description: 'Failure reason if payment failed',
    nullable: true,
  })
  failure_reason?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: null,
    description: 'Failure code if payment failed',
    nullable: true,
  })
  failure_code?: string | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'When payment was initiated',
  })
  initiated_at: Date;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-11T09:05:00Z',
    description: 'When payment was completed',
    nullable: true,
  })
  paid_at?: Date | null;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'When payment expires (for pending payments)',
    nullable: true,
  })
  expires_at?: Date | null;

  @ApiProperty({
    type: Number,
    example: 0.0,
    description: 'Total amount refunded',
    default: 0,
  })
  total_refunded: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Number of refunds processed',
    default: 0,
  })
  refund_count: number;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'When last refund was processed',
    nullable: true,
  })
  last_refund_at?: Date | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether payment is fully refunded',
    default: false,
  })
  is_fully_refunded: boolean;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'When chargeback occurred',
    nullable: true,
  })
  chargeback_at?: Date | null;

  @ApiPropertyOptional({
    type: String,
    example: null,
    description: 'Chargeback reason',
    nullable: true,
  })
  chargeback_reason?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: null,
    description: 'Chargeback amount',
    nullable: true,
  })
  chargeback_amount?: number | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this payment',
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
    description: 'User who last updated this payment',
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:05:00Z',
    description: 'Last update timestamp',
  })
  updated_at: Date;

  @Exclude()
  __entity?: string;
}
