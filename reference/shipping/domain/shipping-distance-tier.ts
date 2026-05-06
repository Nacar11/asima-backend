import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * ShippingDistanceTier domain entity
 */
export class ShippingDistanceTier {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'ID of the associated shipping method',
  })
  method_id: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Minimum distance in km (inclusive)',
  })
  min_distance_km: number;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    nullable: true,
    description: 'Maximum distance in km (exclusive), null = unlimited',
  })
  max_distance_km?: number | null;

  @ApiProperty({
    type: Number,
    example: 50.0,
    description: 'Fee for this distance tier',
  })
  fee: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Display order for sorting',
  })
  display_order: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @Exclude()
  __entity?: string;
}
