import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  IsNumber,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * DTO for creating a checkout payment.
 *
 * Used when initiating a payment for a checkout order.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateCheckoutPaymentDto {
  @ApiPropertyOptional({
    description: 'Checkout order ID to create payment for',
    example: 1,
  })
  @ValidateIf((o) => !o.sales_order_id)
  @IsInt()
  @IsPositive()
  checkout_order_id?: number;

  @ApiPropertyOptional({
    description:
      'Sales order ID to create payment for (optional for session-based checkout)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  sales_order_id?: number | null;

  @ApiPropertyOptional({
    description: 'Currency code (for sales order payments)',
    example: 'PHP',
    default: 'PHP',
  })
  @IsOptional()
  @IsString()
  currency_code?: string;

  @ApiPropertyOptional({
    description: 'Payment description (for sales order payments)',
    example: 'Payment for Order ORD-M5K8P2Q3-A7B9',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      'Payment method code. Built-in codes: cod, gcash, maya, paymaya, paymaya_direct, credit_card, rcbc, chinabank, pnb, gcash_dp, grabpay, shopeepay, bpi, bdo, unionbank, metrobank, instapay, pesonet, 7eleven, bayad, cebuana, mlhuillier, ecpay, bog, bogx. Custom methods use the format custom-{id}.',
    example: 'gcash',
  })
  @IsString()
  @Matches(
    /^(cod|gcash|maya|paymaya|paymaya_direct|credit_card|rcbc|chinabank|pnb|gcash_dp|grabpay|shopeepay|bpi|bdo|unionbank|metrobank|instapay|pesonet|7eleven|bayad|cebuana|mlhuillier|ecpay|bog|bogx|custom-\d+)$/,
    { message: 'payment_method_code must be a valid payment method code' },
  )
  payment_method_code: string;

  @ApiPropertyOptional({
    description: 'Payment type (full, partial, installment)',
    example: 'full',
    default: 'full',
    enum: ['full', 'partial', 'installment'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['full', 'partial', 'installment'])
  payment_type?: string;

  @ApiPropertyOptional({
    description: 'Installment ID if this is an installment payment',
    example: null,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  installment_id?: number;

  @ApiPropertyOptional({
    description:
      'Payment amount (if partial payment). If not provided, uses order grand_total',
    example: 5000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({
    description: 'End-user IP address (required for DragonPay V2)',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the payment (e.g., session_token)',
    example: { session_token: 'abc123', user_id: 1 },
  })
  @IsOptional()
  metadata?: any;
}
