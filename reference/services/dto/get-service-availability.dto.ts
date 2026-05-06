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
 * DTO for querying service availability.
 *
 * Used to get available time slots for a specific service and date.
 * Optionally includes location parameters for service area validation.
 *
 * @version 2
 * @since 1.0.0
 */
export class GetServiceAvailabilityDto {
  @ApiProperty({
    type: String,
    format: 'date',
    example: '2025-12-20',
    description: 'Date to check availability for (YYYY-MM-DD)',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    type: Number,
    example: 2,
    description:
      'Optional package ID to check availability for specific package',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  package_id?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      '[DEPRECATED] Member ID - no longer used (seller is the provider)',
    deprecated: true,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  member_id?: number;

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
