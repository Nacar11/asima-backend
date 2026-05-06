import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  IsInt,
  IsPositive,
} from 'class-validator';
import { CheckoutStatusEnum } from '@/checkout-orders/enums/checkout-status.enum';
import { PaymentStatusEnum } from '@/checkout-orders/enums/payment-status.enum';

/**
 * DTO for updating a checkout order.
 *
 * Used for updating checkout order status, payment status, and other fields.
 * All fields are optional - only provided fields will be updated.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpdateCheckoutOrderDto {
  @ApiPropertyOptional({
    enum: CheckoutStatusEnum,
    description: 'Checkout order status',
    example: CheckoutStatusEnum.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(CheckoutStatusEnum)
  status?: CheckoutStatusEnum;

  @ApiPropertyOptional({
    enum: PaymentStatusEnum,
    description: 'Payment status',
    example: PaymentStatusEnum.PAID,
  })
  @IsOptional()
  @IsEnum(PaymentStatusEnum)
  payment_status?: PaymentStatusEnum;

  @ApiPropertyOptional({
    description: 'Delivery address ID for product orders',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  delivery_address_id?: number;

  @ApiPropertyOptional({
    description: 'Service address ID for service orders',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  service_address_id?: number;

  @ApiPropertyOptional({
    description: 'Customer notes for the order',
    example: 'Please leave at the front door',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customer_notes?: string;

  @ApiPropertyOptional({
    description: 'Internal notes (admin only)',
    example: 'VIP customer - expedite processing',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internal_notes?: string;

  @ApiPropertyOptional({
    description: 'Cancellation reason (required if cancelling)',
    example: 'Customer requested cancellation',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellation_reason?: string;
}
