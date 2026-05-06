import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';
import { ShippingDistanceTier } from './shipping-distance-tier';

/**
 * ShippingMethod domain entity
 */
export class ShippingMethod {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'ID of the associated shipping provider',
  })
  provider_id: number;

  @ApiProperty({
    type: String,
    example: 'Standard Delivery',
    description: 'Display name of the shipping method',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Standard delivery within service area',
    description: 'Description of the shipping method',
  })
  description?: string | null;

  @ApiProperty({
    type: Number,
    example: 30.0,
    description: 'Base fee applied to every shipment',
  })
  base_fee: number;

  @ApiPropertyOptional({
    type: Number,
    example: 5.0,
    nullable: true,
    description: 'Rate charged per kilometer',
  })
  rate_per_km?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    nullable: true,
    description: 'Maximum delivery distance in kilometers',
  })
  max_distance_km?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 20.0,
    nullable: true,
    description: 'Rate charged per kilogram of chargeable weight',
  })
  rate_per_kg?: number | null;

  @ApiProperty({
    type: Number,
    example: 5000,
    description: 'Divisor for volumetric weight calculation (L×W×H / divisor)',
  })
  volumetric_divisor: number;

  @ApiProperty({
    type: Number,
    example: 50.0,
    description: 'Minimum shipping fee to charge',
  })
  minimum_fee: number;

  @ApiPropertyOptional({
    type: Number,
    example: 2000.0,
    nullable: true,
    description: 'Order subtotal threshold for free shipping',
  })
  free_shipping_threshold?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 10.0,
    nullable: true,
    description:
      'Maximum weight (kg) to qualify for free shipping. If order weight exceeds this, shipping is charged even if subtotal meets threshold.',
  })
  free_shipping_max_weight_kg?: number | null;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether this method is currently active',
  })
  is_active: boolean;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Display order for sorting',
  })
  display_order: number;

  @ApiPropertyOptional({
    type: () => [ShippingDistanceTier],
    description: 'Distance tiers for tier-based pricing',
  })
  distance_tiers?: ShippingDistanceTier[];

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
    example: null,
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
