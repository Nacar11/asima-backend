import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIME_REGEX =
  /^(?:([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?|24:00(?::00)?)$/;

/**
 * DTO for checking availability.
 * Simplified: No seller_member_id (seller is the provider).
 *
 * @version 3
 * @since 1.0.0
 */
export class CheckAvailabilityDto {
  @ApiProperty({ type: Number, example: 1, description: 'Seller ID' })
  @Type(() => Number)
  @IsInt()
  seller_id: number;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2025-12-15',
  })
  @IsDateString()
  date: string;

  @ApiProperty({ type: String, example: '14:00:00' })
  @Matches(TIME_REGEX, {
    message: 'start_time must be in HH:mm or HH:mm:ss format',
  })
  start_time: string;

  @ApiProperty({ type: String, example: '15:00:00' })
  @Matches(TIME_REGEX, {
    message: 'end_time must be in HH:mm or HH:mm:ss format',
  })
  end_time: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      'Day of week override (0=Sun..6=Sat). Defaults to derived from date.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week?: number;

  // ==================== Service-level validation fields ====================

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      'Service ID for service-level validations (max_daily_bookings, advance_booking_days, minimum_notice_hours as minutes, service_area)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id?: number;

  // ==================== Location fields for service area validation ====================

  @ApiPropertyOptional({
    type: String,
    example: 'Cebu City',
    description: 'City for service area validation',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Cebu',
    description: 'Province for service area validation',
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    type: String,
    example: '6000',
    description: 'Postal code for service area validation',
  })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 10.3157,
    description: 'Latitude for service area validation (radius check)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 123.8854,
    description: 'Longitude for service area validation (radius check)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1024,
    description:
      'Booking ID to exclude from overlap checks (used when validating booking updates/reschedules).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  exclude_booking_id?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      'Customer ID to exclude from overlapping bookings check (e.g., when adding to cart)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  exclude_customer_id?: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description:
      'Skip minimum_notice_hours validation for special flows (internal use).',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  skip_minimum_notice_hours?: boolean;
}
