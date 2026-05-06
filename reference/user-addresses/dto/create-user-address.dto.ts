import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateUserAddressDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Address label (Home, Work, Shipping, etc.)',
    example: 'Home',
    default: 'Shipping',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiProperty({
    type: String,
    description: 'Name of person receiving delivery',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  recipient_name: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Contact phone for delivery',
    example: '+639123456789',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    type: String,
    description: 'Street address',
    example: '123 Main Street',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  address_line1: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Apt, suite, unit, etc.',
    example: 'Unit 4B',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_line2?: string;

  @ApiProperty({
    type: String,
    description: 'City name',
    example: 'Manila',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    type: String,
    description: 'State or province',
    example: 'Metro Manila',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  state_province: string;

  @ApiProperty({
    type: String,
    description: 'ZIP or postal code',
    example: '1000',
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  postal_code: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Country name',
    example: 'Philippines',
    default: 'Philippines',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Whether this is the default address',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  // ==================== Coordinates for Shipping ====================

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
  latitude?: number | null;

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
  longitude?: number | null;
}
