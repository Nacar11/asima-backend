import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsPhilippinesLatitude,
  IsPhilippinesLongitude,
  PHILIPPINES_BOUNDS,
} from '@/service-areas/validators/philippines-coordinates.validator';

/**
 * DTO for checking if a location is covered by a service's service areas.
 *
 * The check is performed in the following priority:
 * 1. Postal code match (exact)
 * 2. City + Province match (exact)
 * 3. Radius check (if coordinates provided)
 *
 * @version 1
 * @since 1.0.0
 */
export class CheckLocationCoverageDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Service ID to check coverage for',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Quezon City',
    description: 'City name for location check',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Metro Manila',
    description: 'Province/State name for location check',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '1100',
    description: 'Postal code for location check',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 14.5995,
    description: `Customer latitude for radius-based check. Must be within the Philippines (${PHILIPPINES_BOUNDS.minLat}° to ${PHILIPPINES_BOUNDS.maxLat}°)`,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPhilippinesLatitude()
  latitude?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 120.9842,
    description: `Customer longitude for radius-based check. Must be within the Philippines (${PHILIPPINES_BOUNDS.minLng}° to ${PHILIPPINES_BOUNDS.maxLng}°)`,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPhilippinesLongitude()
  longitude?: number | null;
}

/**
 * Response DTO for location coverage check.
 */
export class LocationCoverageResponseDto {
  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether the location is covered by the service',
  })
  covered: boolean;

  @ApiPropertyOptional({
    type: String,
    example: 'Service is not available in the specified location',
    description: 'Reason if location is not covered',
  })
  reason?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 50.0,
    description: 'Additional fee for the location if applicable',
  })
  additional_fee?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'FIXED',
    description: 'Type of additional fee (FIXED or PERCENTAGE)',
  })
  additional_fee_type?: string;
}
