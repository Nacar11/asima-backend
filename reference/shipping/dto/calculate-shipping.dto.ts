import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Location coordinates for distance calculation
 */
export class LocationDto {
  @ApiProperty({
    type: Number,
    example: 10.3157,
    description: 'Latitude coordinate',
  })
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({
    type: Number,
    example: 123.8854,
    description: 'Longitude coordinate',
  })
  @IsNotEmpty()
  @IsNumber()
  longitude: number;
}

/**
 * Address data for zone resolution
 */
export class AddressDataDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Philippines',
    description: 'Country name',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Central Visayas',
    description: 'Region name',
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Cebu',
    description: 'Province name',
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Cebu City',
    description: 'City/Municipality name',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    type: String,
    example: '6000',
    description: 'Postal/ZIP code',
  })
  @IsOptional()
  @IsString()
  postal_code?: string;
}

/**
 * Item for shipping calculation
 */
export class ShippingItemDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Quantity of items',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    type: Number,
    example: 0.5,
    description: 'Weight in kg per item',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  weight_kg: number;

  @ApiPropertyOptional({
    type: Number,
    example: 20,
    description: 'Length in cm',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length_cm?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 15,
    description: 'Width in cm',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width_cm?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    description: 'Height in cm',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height_cm?: number;
}

/**
 * DTO for calculating shipping rates
 */
export class CalculateShippingDto {
  @ApiProperty({
    type: [ShippingItemDto],
    description: 'Items to calculate shipping for',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ShippingItemDto)
  items: ShippingItemDto[];

  @ApiProperty({
    type: LocationDto,
    description: 'Seller/pickup location',
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  seller_location: LocationDto;

  @ApiProperty({
    type: LocationDto,
    description: 'Buyer/delivery location',
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  buyer_location: LocationDto;

  @ApiProperty({
    type: Number,
    example: 1500.0,
    description: 'Order subtotal for free shipping check',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      'Shipping method ID. If not provided, uses first active method from default provider.',
  })
  @IsOptional()
  @IsNumber()
  shipping_method_id?: number;

  @ApiPropertyOptional({
    type: AddressDataDto,
    description:
      'Buyer delivery address for zone-based rate resolution. If provided, zone-specific rates will be applied.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDataDto)
  buyer_address?: AddressDataDto;
}
