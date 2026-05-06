import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PricingTypeEnum } from '@/services/enums/pricing-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { ServiceLocationTypeEnum } from '@/services/enums/service-location-type.enum';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({ type: Number, example: 1 })
  @IsInt()
  seller_id: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  category_id?: number | null;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  currency_id?: number | null;

  @ApiProperty({ type: String, example: 'Aircon Cleaning' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ type: String, example: 'aircon-cleaning' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  code?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  short_description?: string | null;

  @ApiProperty({
    enum: PricingTypeEnum,
    example: PricingTypeEnum.FIXED,
    default: PricingTypeEnum.FIXED,
  })
  @IsEnum(PricingTypeEnum)
  pricing_type: PricingTypeEnum;

  @ApiPropertyOptional({ type: Number, example: 1500 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  base_price?: number | null;

  @ApiPropertyOptional({ type: Number, example: 750 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourly_rate?: number | null;

  @ApiPropertyOptional({ type: Number, example: 120 })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimated_duration_minutes?: number | null;

  @ApiPropertyOptional({ type: Number, example: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimum_duration_minutes?: number | null;

  @ApiPropertyOptional({ type: Number, example: 240 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maximum_duration_minutes?: number | null;

  @ApiPropertyOptional({ type: Number, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  service_radius_km?: number | null;

  /** @deprecated Use service_location_type instead */
  @ApiPropertyOptional({ type: Boolean, example: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_remote_available?: boolean;

  @ApiPropertyOptional({
    enum: ServiceLocationTypeEnum,
    example: ServiceLocationTypeEnum.HOME_SERVICE,
    default: ServiceLocationTypeEnum.HOME_SERVICE,
    description:
      'Where the service is delivered: home_service, walk_in, both, or remote',
  })
  @IsOptional()
  @IsEnum(ServiceLocationTypeEnum)
  service_location_type?: ServiceLocationTypeEnum;

  @ApiPropertyOptional({ type: Number, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_bookings_per_day?: number | null;

  @ApiPropertyOptional({ type: Number, example: 30, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  advance_booking_days?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 30,
    default: 24,
    description:
      'Minimum lead time before booking start, in minutes. Field name is kept for backward compatibility.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimum_notice_hours?: number | null;

  @ApiPropertyOptional({
    enum: ServiceStatusEnum,
    example: ServiceStatusEnum.DRAFT,
    default: ServiceStatusEnum.DRAFT,
  })
  @IsOptional()
  @IsEnum(ServiceStatusEnum)
  status?: ServiceStatusEnum;

  @ApiPropertyOptional({ type: Boolean, example: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({ type: Boolean, example: false, default: false })
  @IsOptional()
  @IsBoolean()
  requires_quote?: boolean;

  @ApiPropertyOptional({ type: Boolean, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  instant_booking?: boolean;

  @ApiPropertyOptional({
    enum: ServiceTypeEnum,
    example: ServiceTypeEnum.STANDARD,
    default: ServiceTypeEnum.STANDARD,
    description:
      'standard (preventive), assessment (reactive), general (simple), or venue (facility rental)',
  })
  @IsOptional()
  @IsEnum(ServiceTypeEnum)
  service_type?: ServiceTypeEnum;

  // ==================== Venue Configuration ====================

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description:
      'Number of bookable units (e.g., 5 courts). Required when service_type = venue.',
  })
  @ValidateIf((o) => o.service_type === ServiceTypeEnum.VENUE)
  @IsNotEmpty({ message: 'Venue capacity is required for venue services' })
  @IsInt()
  @Min(1)
  venue_capacity?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 60,
    description:
      'Duration of each time slot in minutes. Required when service_type = venue.',
  })
  @ValidateIf((o) => o.service_type === ServiceTypeEnum.VENUE)
  @IsNotEmpty({ message: 'Slot duration is required for venue services' })
  @IsInt()
  @Min(15, { message: 'Minimum slot duration is 15 minutes' })
  slot_duration_minutes?: number | null;

  // ==================== Peak Pricing Configuration ====================

  @ApiPropertyOptional({
    type: Number,
    example: 1.5,
    description:
      'Multiplier for peak pricing (e.g., 1.5 = 50% surcharge). Requires peak_days.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1.01, { message: 'Peak multiplier must be greater than 1' })
  peak_price_multiplier?: number | null;

  @ApiPropertyOptional({
    type: [Number],
    example: [0, 5, 6],
    description:
      'Days of week that are peak (0=Sun, 6=Sat). Required when peak_price_multiplier is set.',
  })
  @ValidateIf((o) => o.peak_price_multiplier != null)
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least one peak day is required when peak pricing is set',
  })
  peak_days?: number[] | null;

  @ApiPropertyOptional({
    type: String,
    example: '18:00',
    description:
      'Start of peak hours within peak days. If omitted, entire peak day uses multiplier.',
  })
  @IsOptional()
  @IsString()
  peak_start_time?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '21:00',
    description: 'End of peak hours within peak days.',
  })
  @IsOptional()
  @IsString()
  peak_end_time?: string | null;
}
