import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';

/**
 * UserAddress domain class representing a user's shipping address.
 * Part of the address book feature - users can have multiple addresses.
 */
export class UserAddress {
  @ApiProperty({
    type: Number,
    description: 'Unique identifier for the address',
  })
  id: number;

  @ApiProperty({
    type: Number,
    description: 'User ID who owns this address',
  })
  user_id: number;

  @ApiProperty({
    type: String,
    description: 'Address label (Home, Work, Shipping, etc.)',
    example: 'Home',
    default: 'Shipping',
  })
  label: string;

  @ApiProperty({
    type: String,
    description: 'Name of person receiving delivery',
    example: 'John Doe',
  })
  recipient_name: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Contact phone for delivery',
    example: '+639123456789',
    nullable: true,
  })
  phone?: string | null;

  @ApiProperty({
    type: String,
    description: 'Street address',
    example: '123 Main Street',
  })
  address_line1: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Apt, suite, unit, etc.',
    example: 'Unit 4B',
    nullable: true,
  })
  address_line2?: string | null;

  @ApiProperty({
    type: String,
    description: 'City name',
    example: 'Manila',
  })
  city: string;

  @ApiProperty({
    type: String,
    description: 'State or province',
    example: 'Metro Manila',
  })
  state_province: string;

  @ApiProperty({
    type: String,
    description: 'ZIP or postal code',
    example: '1000',
  })
  postal_code: string;

  @ApiProperty({
    type: String,
    description: 'Country name',
    example: 'Philippines',
    default: 'Philippines',
  })
  country: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether this is the default address',
    default: false,
  })
  is_default: boolean;

  @ApiPropertyOptional({
    type: Number,
    description: 'Latitude coordinate for shipping calculations',
    nullable: true,
  })
  latitude?: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Longitude coordinate for shipping calculations',
    nullable: true,
  })
  longitude?: number | null;

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

  @ApiPropertyOptional({
    nullable: true,
  })
  deleted_at?: Date | null;
}
