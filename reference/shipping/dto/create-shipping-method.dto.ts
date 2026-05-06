import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO for creating a shipping method
 */
export class CreateShippingMethodDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'ID of the associated shipping provider',
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  provider_id: number;

  @ApiProperty({
    type: String,
    example: 'Standard Delivery',
    description: 'Display name of the shipping method',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Regular delivery service',
    description: 'Description of the method',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 30.0,
    description: 'Base fee applied to every shipment',
    default: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  base_fee?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 5.0,
    nullable: true,
    description: 'Rate charged per kilometer',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rate_per_km?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    nullable: true,
    description: 'Maximum delivery distance in kilometers',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  max_distance_km?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 20.0,
    nullable: true,
    description: 'Rate charged per kilogram of chargeable weight',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rate_per_kg?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 5000,
    description: 'Divisor for volumetric weight calculation (L×W×H / divisor)',
    default: 5000,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  volumetric_divisor?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 50.0,
    description: 'Minimum shipping fee to charge',
    default: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimum_fee?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 2000.0,
    nullable: true,
    description: 'Order subtotal threshold for free shipping',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  free_shipping_threshold?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 10.0,
    nullable: true,
    description:
      'Maximum weight (kg) to qualify for free shipping. Orders exceeding this weight pay shipping even if subtotal meets threshold.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  free_shipping_max_weight_kg?: number | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Whether this method is currently active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Display order for sorting',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;
}
