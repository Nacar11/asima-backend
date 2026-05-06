import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStoreAddressDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Address label (e.g., Main Branch, Warehouse)',
    example: 'Main Branch',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Street or building address',
    example: '123 Colon Street',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_line?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Province',
    example: 'Central Visayas',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'City or municipality',
    example: 'Cebu City',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Barangay',
    example: 'Capitol Site',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barangay?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Postal code',
    example: '6000',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Latitude coordinate (-90 to 90)',
    example: 10.31200471,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Longitude coordinate (-180 to 180)',
    example: 123.89348167,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Whether this is the default store address',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
