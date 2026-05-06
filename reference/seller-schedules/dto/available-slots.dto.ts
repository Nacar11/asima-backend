import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for querying available time slots.
 *
 * Used to find available booking slots for a specific date and service.
 * Simplified: No member-specific availability (seller is the provider).
 *
 * Optionally includes location parameters for service area validation.
 *
 * @version 3
 * @since 1.0.0
 */
export class AvailableSlotsDto {
  @ApiProperty({
    type: String,
    format: 'date',
    example: '2024-12-25',
    description: 'Date to check availability for',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Service ID',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id: number;

  @ApiPropertyOptional({
    type: Number,
    example: 30,
    description: 'Slot duration in minutes (default: 30)',
    default: 30,
  })
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @IsOptional()
  slot_duration_minutes?: number;

  // Location fields for service area validation
  @ApiPropertyOptional({
    type: String,
    example: 'Quezon City',
    description: 'City for service area coverage check',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Metro Manila',
    description: 'Province for service area coverage check',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '1100',
    description: 'Postal code for service area coverage check',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 14.5995,
    description: 'Customer latitude for radius-based service area check',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 120.9842,
    description: 'Customer longitude for radius-based service area check',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null;
}

/**
 * Response DTO for available slots.
 * Simplified: No member_id (seller is the provider).
 *
 * @version 3
 * @since 1.0.0
 */
export class AvailableSlotResponseDto {
  @ApiProperty({
    type: String,
    format: 'time',
    example: '09:00:00',
    description: 'Start time of the available slot',
  })
  start_time: string;

  @ApiProperty({
    type: String,
    format: 'time',
    example: '09:30:00',
    description: 'End time of the available slot',
  })
  end_time: string;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether the slot is available',
  })
  available: boolean;

  // ==================== Venue-specific fields ====================

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description:
      'Total bookable units (venue_capacity). Only present for venue services.',
  })
  total_capacity?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 2,
    description:
      'Number of units already booked for this slot. Only present for venue services.',
  })
  booked_count?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 3,
    description: 'Remaining units available. Only present for venue services.',
  })
  remaining?: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description:
      'Whether this slot falls within peak pricing hours. Only present for venue services.',
  })
  is_peak?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 20,
    description:
      'Hourly rate for this slot (base_price or base_price × peak_multiplier). Only present for venue services.',
  })
  hourly_rate?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Blocked by venue',
    description: 'Reason why the slot is unavailable (when available = false).',
  })
  unavailable_reason?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'blocked',
    description:
      'Source of unavailability reason (blocked, booking, capacity, notice, daily_limit, location, rule).',
  })
  unavailable_source?:
    | 'blocked'
    | 'booking'
    | 'capacity'
    | 'notice'
    | 'daily_limit'
    | 'location'
    | 'rule';
}
