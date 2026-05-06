import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';
import { ProviderType } from './enums/shipping.enum';
import { ShippingMethod } from './shipping-method';

/**
 * ShippingProvider domain entity
 */
export class ShippingProvider {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Unique identifier',
  })
  id: number;

  @ApiProperty({
    type: String,
    example: 'In-House Delivery',
    description: 'Name of the shipping provider',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'in_house',
    description: 'Unique code for the provider',
  })
  code: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Company-operated delivery service',
    description: 'Description of the provider',
  })
  description?: string | null;

  @ApiProperty({
    enum: ProviderType,
    example: ProviderType.IN_HOUSE,
    description: 'Type of shipping provider',
  })
  provider_type: ProviderType;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether the provider is active',
  })
  is_active: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether this is the default provider',
  })
  is_default: boolean;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Display order for sorting',
  })
  display_order: number;

  @ApiPropertyOptional({
    type: () => [ShippingMethod],
    description: 'Shipping methods for this provider',
  })
  methods?: ShippingMethod[];

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
    description: 'User who created this record',
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    description: 'When this record was created',
  })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
    description: 'User who last updated this record',
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    description: 'When this record was last updated',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    description: 'When this record was deleted',
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
