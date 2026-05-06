import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  Min,
  IsDateString,
  Matches,
} from 'class-validator';

/**
 * DTO for creating a quote request.
 *
 * Used when a customer requests a quote for a service
 * that has `requires_quote = true`.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateQuoteRequestDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Service ID to request quote for',
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  service_id: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      'Optional package ID if requesting quote for a specific package',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  package_id?: number;

  @ApiProperty({
    type: String,
    example:
      'I need aircon cleaning for 3 split-type units in my office building...',
    description: 'Detailed description of the service requirements',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Must be completed on a weekend, preferably before 10 AM.',
    description: 'Any special requirements or constraints',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  special_requirements?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 3,
    description: 'Quantity of service units (e.g., 3 aircon units)',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number = 1;

  @ApiPropertyOptional({
    type: String,
    example: '2025-02-15',
    description: 'Preferred date for the service (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  preferred_date?: string;

  @ApiPropertyOptional({
    type: String,
    example: '09:00:00',
    description: 'Preferred time for the service (HH:mm:ss)',
  })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'preferred_time must be in HH:mm:ss format',
  })
  preferred_time?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Service address ID from user addresses',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  service_address_id?: number;

  @ApiPropertyOptional({
    type: String,
    example: '123 Main St, Quezon City, Metro Manila',
    description: 'Service address as text (if not using address ID)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  service_address_text?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 14.5995,
    description: 'Service location latitude',
  })
  @IsOptional()
  @IsNumber()
  service_latitude?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 120.9842,
    description: 'Service location longitude',
  })
  @IsOptional()
  @IsNumber()
  service_longitude?: number;
}
