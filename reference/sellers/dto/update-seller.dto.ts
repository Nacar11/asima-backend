import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmpty,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';
import { BusinessTypeEnum } from '@/sellers/enums/business-type.enum';

/**
 * DTO for updating a seller
 */
export class UpdateSellerDto {
  @ApiPropertyOptional({
    type: String,
    example: 'tech-store-updated',
    description: 'URL-friendly slug for the store',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Tech Store Updated',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  store_name?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'A store selling electronics and gadgets',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  store_description?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/logo.png',
    nullable: true,
    description: 'Store logo URL or storage path',
  })
  @IsOptional()
  @IsString()
  store_logo_url?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/banner.png',
    nullable: true,
    description: 'Store banner URL or storage path',
  })
  @IsOptional()
  @IsString()
  store_banner_url?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'BR123456789',
    nullable: true,
    description:
      'Business registration number (max 30 characters for Philippine standards)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  business_registration_number?: string | null;

  @ApiPropertyOptional({
    enum: BusinessTypeEnum,
    example: BusinessTypeEnum.SOLE_PROPRIETOR,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(BusinessTypeEnum)
  business_type?: BusinessTypeEnum | null;

  @ApiPropertyOptional({
    type: String,
    example: '123456789000',
    nullable: true,
    description:
      'Tax Identification Number (TIN) - 9 digits for individuals or 12 digits (9 + 3 branch code) for businesses. Digits only, no hyphens.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{9}(\d{3})?$/, {
    message:
      'TIN must be 9 digits or 12 digits (including branch code), digits only with no hyphens',
  })
  tax_id?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'John Doe',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.bank_name)
  @IsString()
  @MaxLength(255)
  @ValidateIf((o) => !o.bank_name)
  @IsEmpty({ message: 'Bank account holder requires bank name' })
  bank_account_holder?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '123456789012',
    nullable: true,
    description:
      'Bank account number - digits only, 6 to 24 digits (no spaces or special characters)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((o) => !o.bank_name)
  @IsEmpty({ message: 'Bank account number requires bank name' })
  @ValidateIf((o) => !!o.bank_name)
  @Matches(/^\d{6,24}$/, {
    message: 'Invalid account number format. Must be 6 to 24 digits.',
  })
  bank_account_number?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Bank of America',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' ? null : typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  bank_name?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '+63 912 345 6789',
    nullable: true,
    description: 'Store/seller contact number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contact?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'store@example.com',
    nullable: true,
    description: 'Store/seller email address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com',
    nullable: true,
    description: 'Store/seller website URL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 25.5,
    nullable: false,
    default: 0,
    description: 'Hourly rate when selling services',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999)
  hourly_rate?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    nullable: true,
    description: 'Years of experience as a service provider',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  years_of_experience?: number | null;

  @ApiPropertyOptional({
    enum: ActiveInactiveStatusEnum,
    example: ActiveInactiveStatusEnum.ACTIVE,
    description: 'Seller status: Active or Inactive',
  })
  @IsOptional()
  @IsEnum(ActiveInactiveStatusEnum, {
    message: 'status must be one of the following values: Active, Inactive',
  })
  status?: ActiveInactiveStatusEnum;

  // ==================== Pickup Location for Shipping ====================

  @ApiPropertyOptional({
    type: String,
    example: '123 Warehouse Street',
    description: 'Pickup/warehouse address for shipping',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pickup_address?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Cebu City',
    description: 'Pickup location city',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pickup_city?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Cebu',
    description: 'Pickup location province',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pickup_province?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '6000',
    description: 'Pickup location postal code',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  pickup_postal_code?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 10.3157,
    description:
      'Latitude coordinate for shipping distance calculation (-90 to 90)',
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickup_latitude?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 123.8854,
    description:
      'Longitude coordinate for shipping distance calculation (-180 to 180)',
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickup_longitude?: number | null;

  // ==================== Pickup Configuration ====================

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Whether pickup is enabled for this seller',
  })
  @IsOptional()
  @IsBoolean()
  pickup_enabled?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    nullable: true,
    description:
      'Pickup address ID from user_addresses table. Required when pickup_enabled=true.',
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) =>
    value !== undefined && value !== null ? parseInt(value, 10) : value,
  )
  @ValidateIf((dto) => dto.pickup_enabled === true)
  @IsNotEmpty({ message: 'Pickup address is required when pickup is enabled' })
  pickup_address_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 30,
    default: 30,
    description: 'Preparation time in minutes before pickup is ready (15–480)',
  })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  pickup_preparation_time?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    default: 10,
    description: 'Maximum concurrent pickup orders (1–100)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pickup_max_concurrent_orders?: number;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Please arrive at the back entrance and ring the bell',
    description: 'Pickup instructions for customers',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  pickup_instructions?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 120,
    default: 120,
    description:
      'Grace period in minutes before marking pickup as no-show (30–1440)',
  })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(1440)
  pickup_grace_period?: number;

  // File upload fields - can be either file uploads (multipart/form-data) or URL strings (application/json)
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description:
      'Store logo image file (for multipart/form-data) or URL string (for application/json)',
  })
  @IsOptional()
  @IsString()
  logo?: string | any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description:
      'Store banner image file (for multipart/form-data) or URL string (for application/json)',
  })
  @IsOptional()
  @IsString()
  banner?: string | any;

  // ==================== Service Location for Walk-in Appointments ====================

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    nullable: true,
    description:
      'User address ID for walk-in service location (from user_addresses)',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  @IsNumber()
  service_location_address_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    nullable: true,
    description: 'E-District ID this seller belongs to',
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : null,
  )
  edistrict_id?: number | null;

  // ==================== Booking Capacity Settings ====================

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    default: 1,
    description:
      'Maximum number of bookings that can be scheduled at the same time',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  max_concurrent_bookings?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 8,
    default: 8,
    description: 'Maximum number of bookings per day',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  max_daily_bookings?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 8.0,
    default: 8,
    description: 'Total service capacity hours per day',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  service_capacity_hours?: number;
}
