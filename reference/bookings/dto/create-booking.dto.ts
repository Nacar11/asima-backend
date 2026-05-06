import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsDateString,
  Matches,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  Min,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentLocationTypeEnum } from '@/bookings/enums/appointment-location-type.enum';

/**
 * DTO for creating a booking from checkout order.
 *
 * Used when creating bookings from checkout orders that contain service items.
 * Most fields are derived from the checkout order and cart items.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateBookingDto {
  @ApiProperty({
    description: 'Checkout order ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  checkout_order_id: number;

  @ApiProperty({
    description: 'Seller ID providing the service',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  seller_id: number;

  @ApiProperty({
    description: 'Service ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  service_id: number;

  @ApiPropertyOptional({
    description: 'Service package ID (if booking includes a package)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  package_id?: number;

  @ApiProperty({
    description: 'Customer ID making the booking',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  customer_id: number;

  @ApiProperty({
    description: 'Scheduled date for the service (YYYY-MM-DD)',
    example: '2024-12-25',
  })
  @IsNotEmpty()
  @IsDateString()
  scheduled_date: string;

  @ApiProperty({
    description: 'Scheduled start time (HH:mm:ss)',
    example: '09:00:00',
  })
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'scheduled_start_time must be in HH:mm:ss format',
  })
  scheduled_start_time: string;

  @ApiPropertyOptional({
    description: 'Scheduled end time (HH:mm:ss)',
    example: '11:00:00',
  })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'scheduled_end_time must be in HH:mm:ss format',
  })
  scheduled_end_time?: string;

  @ApiPropertyOptional({
    description: 'Service address ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  service_address_id?: number;

  @ApiPropertyOptional({
    description: 'Service address as text (if not using address ID)',
    example: '123 Main St, City, Province',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  service_address_text?: string;

  @ApiPropertyOptional({
    description: 'Service location latitude',
    example: 14.5995,
  })
  @IsOptional()
  @IsNumber()
  service_latitude?: number;

  @ApiPropertyOptional({
    description: 'Service location longitude',
    example: 120.9842,
  })
  @IsOptional()
  @IsNumber()
  service_longitude?: number;

  @ApiPropertyOptional({
    description: 'Appointment location type',
    enum: AppointmentLocationTypeEnum,
    default: AppointmentLocationTypeEnum.HOME_SERVICE,
  })
  @IsOptional()
  @IsEnum(AppointmentLocationTypeEnum)
  appointment_location_type?: AppointmentLocationTypeEnum;

  // Price breakdown fields
  @ApiProperty({
    description: 'Base service/package price',
    example: 1200.0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  base_price: number;

  @ApiPropertyOptional({
    description: 'Total of all selected add-ons',
    example: 200.0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  addons_total?: number;

  @ApiPropertyOptional({
    description: 'Total of all option value price adjustments',
    example: 100.0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  options_total?: number;

  @ApiPropertyOptional({
    description: 'Location-based additional fee from service area',
    example: 50.0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  location_additional_fee?: number;

  @ApiProperty({
    description:
      'Subtotal amount (base_price + addons_total + options_total + location_additional_fee)',
    example: 1550.0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({
    description: 'Discount amount',
    example: 0.0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_amount?: number;

  @ApiPropertyOptional({
    description: 'Platform fee percentage',
    example: 10.0,
    default: 10.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  platform_fee_percent?: number;

  @ApiPropertyOptional({
    description: 'Customer notes for the booking',
    example: 'Please arrive before 9 AM',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customer_notes?: string;

  @ApiPropertyOptional({
    description:
      'Voucher codes to apply to the booking (stacked; discount applied sequentially)',
    example: ['PICKLE-FREE-001', 'PICKLE-FREE-002'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  voucher_codes?: string[];
}
