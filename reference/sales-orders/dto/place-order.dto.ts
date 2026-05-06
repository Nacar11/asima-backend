import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  IsUUID,
  IsInt,
  Min,
  IsArray,
  IsNumber,
  ValidateIf,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { CheckoutSourceEnum } from '../domain/checkout-source.enum';

/**
 * DTO for placing an order (converting cart to order)
 */
export class PlaceOrderDto {
  @ApiPropertyOptional({
    description:
      'Idempotency key to prevent duplicate orders. If provided, subsequent requests with the same key will return the existing order instead of creating a new one.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  idempotency_key?: string;

  @ApiPropertyOptional({
    description:
      'Shipping address ID from user address book. Use 0 or omit for walk-in/venue (use default). If provided and > 0, must be a valid user address.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  address_id?: number;

  @ApiPropertyOptional({
    description:
      'Shipping method ID. If not provided or 0, uses first active method from default provider.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  shipping_method_id?: number;

  @ApiPropertyOptional({
    description: 'Optional notes for the order',
    example: 'Please handle with care',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Payment method code. Defaults to cod if omitted.',
    example: 'gcash',
  })
  @IsOptional()
  @IsString()
  payment_method_code?: string;

  @ApiPropertyOptional({
    description: 'End-user IP address (for payment gateway)',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional({
    description: 'Checkout source platform',
    enum: CheckoutSourceEnum,
    example: CheckoutSourceEnum.EKUMPRA,
  })
  @IsOptional()
  @IsEnum(CheckoutSourceEnum)
  checkout_source?: CheckoutSourceEnum;

  @ApiPropertyOptional({
    description:
      'Optional voucher IDs from checkout preview. Currently accepted for compatibility with mobile payloads.',
    example: [101, 202],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  vouchers?: number[];

  @ApiPropertyOptional({
    description:
      'Voucher codes to apply to Travajo (service/venue) bookings. Applied when creating bookings for service items.',
    example: ['SERVICE4DEAL'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  booking_voucher_codes?: string[];

  // ==================== Pickup Fields ====================

  @ApiPropertyOptional({
    description: 'Fulfillment type: delivery or pickup',
    example: 'delivery',
    enum: ['delivery', 'pickup'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['delivery', 'pickup'])
  fulfillment_type?: 'delivery' | 'pickup';

  @ApiPropertyOptional({
    description:
      'Pickup date (YYYY-MM-DD format). Required if fulfillment_type is pickup.',
    example: '2024-12-25',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'pickup_date must be in YYYY-MM-DD format',
  })
  @ValidateIf((dto) => dto.fulfillment_type === 'pickup')
  @IsNotEmpty({
    message: 'Pickup date is required when fulfillment type is pickup',
  })
  pickup_date?: string;

  @ApiPropertyOptional({
    description:
      'Pickup time (HH:MM format). Required if fulfillment_type is pickup.',
    example: '14:30',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'pickup_time must be in HH:MM format' })
  @ValidateIf((dto) => dto.fulfillment_type === 'pickup')
  @IsNotEmpty({
    message: 'Pickup time is required when fulfillment type is pickup',
  })
  pickup_time?: string;

  @ApiPropertyOptional({
    description: 'Pickup notes for the seller',
    example: 'Please call me when you arrive',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pickup_notes?: string;
}
