import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIME_REGEX =
  /^(?:([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?|24:00(?::00)?)$/;

/**
 * DTO for a single item in bulk availability check.
 */
export class BulkCheckAvailabilityItemDto {
  @ApiProperty({ type: Number, example: 1, description: 'Seller ID' })
  @Type(() => Number)
  @IsInt()
  seller_id: number;

  @ApiProperty({ type: Number, example: 1, description: 'Service ID' })
  @Type(() => Number)
  @IsInt()
  service_id: number;

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
    example: 0,
    description: 'Day of week override (0=Sun..6=Sat)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week?: number;

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
    description: 'Latitude for service area validation',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 123.8854,
    description: 'Longitude for service area validation',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}

/**
 * DTO for bulk availability check request.
 */
export class BulkCheckAvailabilityDto {
  @ApiProperty({
    type: [BulkCheckAvailabilityItemDto],
    description: 'Array of items to check availability for',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCheckAvailabilityItemDto)
  items: BulkCheckAvailabilityItemDto[];
}

/**
 * Response for a single item in bulk availability check.
 */
export class BulkCheckAvailabilityResultDto {
  @ApiProperty({ type: Number, description: 'Service ID' })
  service_id: number;

  @ApiProperty({ type: Boolean, description: 'Whether the slot is available' })
  available: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Reason if not available',
  })
  reason?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Current concurrent bookings at this time',
  })
  concurrent_bookings?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Maximum allowed concurrent bookings',
  })
  max_concurrent?: number;
}

/**
 * Response for bulk availability check.
 */
export class BulkCheckAvailabilityResponseDto {
  @ApiProperty({
    type: Boolean,
    description: 'Whether all items are available',
  })
  all_available: boolean;

  @ApiProperty({
    type: [BulkCheckAvailabilityResultDto],
    description: 'Individual results for each item',
  })
  results: BulkCheckAvailabilityResultDto[];
}
