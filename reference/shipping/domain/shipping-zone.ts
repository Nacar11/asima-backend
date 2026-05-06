import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';
import { AreaType } from './enums/shipping.enum';

/**
 * ShippingZoneArea domain class
 */
export class ShippingZoneArea {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  zone_id: number;

  @ApiProperty({ enum: AreaType, example: AreaType.CITY })
  area_type: AreaType;

  @ApiProperty({ type: String, example: 'Cebu City' })
  area_value: string;

  @ApiProperty({ type: Date })
  created_at: Date;
}

/**
 * ShippingZone domain class
 * Geographic regions per provider
 */
export class ShippingZone {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  provider_id: number;

  @ApiProperty({ type: String, example: 'Metro Cebu' })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Covers Cebu City and nearby areas',
  })
  description?: string | null;

  @ApiProperty({ type: Boolean, example: false })
  is_default: boolean;

  @ApiProperty({ type: Boolean, example: true })
  is_active: boolean;

  @ApiProperty({ type: Number, example: 0 })
  priority: number;

  @ApiPropertyOptional({ type: () => [ShippingZoneArea] })
  areas?: ShippingZoneArea[];

  @ApiPropertyOptional({ type: () => User, nullable: true })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({ type: Date })
  created_at: Date;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({ type: Date })
  updated_at: Date;

  @ApiPropertyOptional({ type: Date, nullable: true })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
