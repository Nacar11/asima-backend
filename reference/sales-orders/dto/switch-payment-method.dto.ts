import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/** Kept in sync with the enum list in CreateCheckoutPaymentDto */
export const SUPPORTED_PAYMENT_METHODS = [
  'gcash',
  'maya',
  'paymaya',
  'grabpay',
  'shopeepay',
  'bpi',
  'bdo',
  'unionbank',
  'metrobank',
  'instapay',
  'pesonet',
  '7eleven',
  'bayad',
  'cebuana',
  'mlhuillier',
  'ecpay',
  'credit_card',
  'cod',
  'bog',
  'bogx',
] as const;

/**
 * Switch Payment Method DTO
 * Used to change payment method for a PENDING order
 */
export class SwitchPaymentMethodDto {
  @ApiProperty({
    description: 'New payment method code',
    example: 'gcash',
    enum: SUPPORTED_PAYMENT_METHODS,
  })
  @IsEnum(SUPPORTED_PAYMENT_METHODS, {
    message: `payment_method_code must be one of: ${SUPPORTED_PAYMENT_METHODS.join(', ')}`,
  })
  payment_method_code: string;

  @ApiPropertyOptional({
    description: 'Client IP address for payment gateway (required for non-COD)',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString()
  ip_address?: string;
}
