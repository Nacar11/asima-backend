import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for shipping rate calculation response
 */
export class ShippingRateResponseDto {
  @ApiProperty({
    type: Number,
    example: 110.0,
    description: 'Total shipping amount',
  })
  shipping_amount: number;

  @ApiProperty({
    type: Number,
    example: 8.5,
    description: 'Calculated distance in km',
  })
  distance_km: number;

  @ApiProperty({
    type: Number,
    example: 2.0,
    description: 'Total chargeable weight in kg',
  })
  chargeable_weight_kg: number;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether free shipping was applied',
  })
  is_free_shipping: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'ID of the shipping method used',
  })
  method_id?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Standard Delivery',
    description: 'Name of the shipping method used',
  })
  method_name?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'ID of the shipping provider',
  })
  provider_id?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'In-House Delivery',
    description: 'Name of the shipping provider',
  })
  provider_name?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    nullable: true,
    description: 'ID of the shipping zone (if zone-based rates applied)',
  })
  zone_id?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Metro Cebu',
    nullable: true,
    description: 'Name of the shipping zone (if zone-based rates applied)',
  })
  zone_name?: string | null;

  @ApiProperty({
    type: Object,
    description: 'Breakdown of shipping calculation',
    example: {
      base_fee: 30.0,
      distance_fee: 40.0,
      weight_fee: 40.0,
      subtotal: 110.0,
      minimum_fee: 50.0,
      final_amount: 110.0,
    },
  })
  breakdown: {
    base_fee: number;
    distance_fee: number;
    weight_fee: number;
    subtotal: number;
    minimum_fee: number;
    final_amount: number;
  };
}
