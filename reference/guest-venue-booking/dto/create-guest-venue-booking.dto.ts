import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayMaxSize,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  IsInt,
  IsArray,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';

export const GUEST_VENUE_PAYMENT_METHODS = [
  'gcash',
  'paymaya_direct',
  'unionbank',
  'maya_qr',
  'unionbank_qr',
] as const;
export type GuestVenuePaymentMethod =
  | (typeof GUEST_VENUE_PAYMENT_METHODS)[number]
  | `custom-${number}`;

const CUSTOM_PAYMENT_METHOD_REGEX = /^custom-\d+$/;

/** Accepts builtin payment method codes AND admin-added custom-{id} codes. */
export function IsValidPaymentMethod(options?: ValidationOptions) {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName as string,
      options: {
        message: `payment_method must be one of [${GUEST_VENUE_PAYMENT_METHODS.join(', ')}] or a custom method code (custom-{id})`,
        ...options,
      },
      constraints: [],
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          return (
            (GUEST_VENUE_PAYMENT_METHODS as readonly string[]).includes(
              value,
            ) || CUSTOM_PAYMENT_METHOD_REGEX.test(value)
          );
        },
      },
    });
  };
}

export const normalizeGuestVenuePaymentMethod = (
  value: unknown,
): GuestVenuePaymentMethod | string => {
  const normalized = String(value ?? 'gcash')
    .trim()
    .toLowerCase();

  if (normalized === 'maya' || normalized === 'paymaya') {
    return 'paymaya_direct';
  }

  if (normalized === 'union_bank') {
    return 'unionbank';
  }

  return normalized;
};

const TIME_WITH_OPTIONAL_END_OF_DAY_REGEX =
  /^(([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]|24:00:00)$/;

export class CreateGuestAdditionalGuestDto {
  @ApiProperty({ type: String, example: 'Jane' })
  @IsString()
  @Length(1, 100)
  first_name: string;

  @ApiProperty({ type: String, example: 'Doe' })
  @IsString()
  @Length(1, 100)
  last_name: string;
}

export class CreateGuestVenueBookingDto {
  @ApiProperty({ type: Number, example: 42 })
  @Type(() => Number)
  @IsInt()
  service_id: number;

  @ApiProperty({ type: String, example: '2026-03-15' })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduled_date: string;

  @ApiProperty({ type: String, example: '09:00:00' })
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
  scheduled_start_time: string;

  @ApiProperty({ type: String, example: '12:00:00' })
  @IsNotEmpty()
  @Matches(TIME_WITH_OPTIONAL_END_OF_DAY_REGEX, {
    message:
      'scheduled_end_time must be in HH:mm:ss format or exactly 24:00:00',
  })
  scheduled_end_time: string;

  @ApiProperty({ type: String, example: 'Juan' })
  @IsString()
  @Length(1, 100)
  first_name: string;

  @ApiProperty({ type: String, example: 'dela Cruz' })
  @IsString()
  @Length(1, 100)
  last_name: string;

  @ApiProperty({ type: String, example: 'juan@example.com' })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @IsEmail()
  @Length(1, 100)
  email: string;

  @ApiProperty({ type: String, example: '+639171234567' })
  @IsString()
  @Length(7, 20)
  phone: string;

  @ApiPropertyOptional({
    type: String,
    enum: GUEST_VENUE_PAYMENT_METHODS,
    example: 'gcash',
    default: 'gcash',
  })
  @Transform(({ value }) => normalizeGuestVenuePaymentMethod(value))
  @IsOptional()
  @IsString()
  @IsValidPaymentMethod()
  payment_method?: GuestVenuePaymentMethod;

  @ApiPropertyOptional({
    type: String,
    example: 'Bring extra towels',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ type: [Number], example: [1, 3], nullable: true })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (Array.isArray(value)) return value.map((v) => Number(v));
    return [Number(value)];
  })
  addon_ids?: number[];

  @ApiPropertyOptional({
    type: String,
    example: '192.168.1.1',
    nullable: true,
    description: 'End-user IP address (recommended for DragonPay V2)',
  })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional({
    type: [CreateGuestAdditionalGuestDto],
    description:
      'Additional guests beyond the primary contact. Max 7 so the booking total stays within 8 persons.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => CreateGuestAdditionalGuestDto)
  additional_guests?: CreateGuestAdditionalGuestDto[];
}

export class GuestVoucherAssignmentDto {
  @ApiProperty({ type: String, example: 'COFFEEB1T1' })
  @IsString()
  @IsNotEmpty()
  voucher_code: string;

  @ApiProperty({
    type: Number,
    example: 42,
    description: 'The user_voucher ID (from validation step)',
  })
  @Type(() => Number)
  @IsInt()
  user_voucher_id: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Index of the booking in the bookings array',
  })
  @Type(() => Number)
  @IsInt()
  booking_index: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Number of hours to apply from this voucher to this booking',
  })
  @Type(() => Number)
  @IsInt()
  hours: number;
}

export class CreateGuestVenueBookingsDto {
  @ApiProperty({
    type: [CreateGuestVenueBookingDto],
    description:
      'Array of guest venue bookings. Use one item per selected slot range.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGuestVenueBookingDto)
  bookings: CreateGuestVenueBookingDto[];

  @ApiPropertyOptional({
    type: [GuestVoucherAssignmentDto],
    description: 'Voucher assignments mapping vouchers to bookings by index',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestVoucherAssignmentDto)
  voucher_assignments?: GuestVoucherAssignmentDto[];
}
