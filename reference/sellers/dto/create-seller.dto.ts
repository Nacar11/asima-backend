import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmpty,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Matches,
  Max,
  Min,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BusinessTypeEnum } from '@/sellers/enums/business-type.enum';
import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';

/**
 * DTO for creating a seller
 */
export class CreateSellerDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'User ID (one-to-one relationship)',
  })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  user_id: number;

  @ApiProperty({
    type: String,
    example: 'Tech Store',
    description: 'Store name',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  store_name: string;

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
    example: 'tech-store',
    description: 'Unique seller slug',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    return value;
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  slug?: string;

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
    type: Boolean,
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  is_verified?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  is_active?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  sells_products?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  sells_services?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  auto_accept_bookings?: boolean;

  @ApiPropertyOptional({
    type: String,
    example: 'Experienced in home renovations and repairs.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  bio?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  years_of_experience?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 25.5,
    nullable: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999)
  hourly_rate?: number;

  @ApiPropertyOptional({
    enum: ActiveInactiveStatusEnum,
    example: ActiveInactiveStatusEnum.ACTIVE,
    default: ActiveInactiveStatusEnum.ACTIVE,
    description: 'Seller status: Active or Inactive',
  })
  @IsOptional()
  @IsEnum(ActiveInactiveStatusEnum, {
    message: 'status must be one of the following values: Active, Inactive',
  })
  status?: ActiveInactiveStatusEnum;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    nullable: true,
    description: 'E-District ID this seller belongs to',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
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
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  max_concurrent_bookings?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 8,
    default: 8,
    description: 'Maximum number of bookings per day',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
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
  @Type(() => Number)
  service_capacity_hours?: number;
}
