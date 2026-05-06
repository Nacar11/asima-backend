import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';

/**
 * StoreAddress domain class representing a seller's physical store location.
 * Sellers can have multiple branch addresses.
 * Used for customer-facing store display and as delivery origin points.
 */
export class StoreAddress {
  @ApiProperty({
    type: Number,
    description: 'Unique identifier for the store address',
  })
  id: number;

  @ApiProperty({
    type: Number,
    description: 'Seller ID who owns this store address',
  })
  seller_id: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Address label (e.g., Main Branch, Warehouse)',
    example: 'Main Branch',
    nullable: true,
  })
  label?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Street or building address',
    example: '123 Colon Street',
    nullable: true,
  })
  address_line?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Province',
    example: 'Central Visayas',
    nullable: true,
  })
  province?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'City or municipality',
    example: 'Cebu City',
    nullable: true,
  })
  city?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Barangay',
    example: 'Capitol Site',
    nullable: true,
  })
  barangay?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Postal code',
    example: '6000',
    nullable: true,
  })
  postal_code?: string | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Latitude coordinate (-90 to 90)',
    example: 10.31200471,
    nullable: true,
  })
  latitude?: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Longitude coordinate (-180 to 180)',
    example: 123.89348167,
    nullable: true,
  })
  longitude?: number | null;

  @ApiProperty({
    type: Boolean,
    description: 'Whether this is the default store address',
    default: false,
  })
  is_default: boolean;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({ nullable: true })
  deleted_at?: Date | null;
}
