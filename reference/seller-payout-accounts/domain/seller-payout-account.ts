import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { PayoutAccountTypeEnum } from '../enums/payout-account-type.enum';

/**
 * Seller Payout Account domain model.
 *
 * Represents a payout account for a seller (bank account, e-wallet, etc.).
 *
 * @version 1
 * @since 1.0.0
 */
export class SellerPayoutAccount {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller payout account ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID',
  })
  seller_id: number;

  @ApiPropertyOptional({
    type: Object,
    description: 'Seller details',
  })
  seller?: any;

  @ApiProperty({
    enum: PayoutAccountTypeEnum,
    example: PayoutAccountTypeEnum.BANK_TRANSFER,
    description: 'Account type',
  })
  account_type: PayoutAccountTypeEnum;

  @ApiProperty({
    type: String,
    example: 'John Doe',
    description: 'Account name',
  })
  account_name: string;

  @ApiProperty({
    type: String,
    example: '1234567890',
    description: 'Account number',
  })
  account_number: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Bank of the Philippines',
    description: 'Bank name',
    nullable: true,
  })
  bank_name?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'BOP',
    description: 'Bank code',
    nullable: true,
  })
  bank_code?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Makati Branch',
    description: 'Bank branch',
    nullable: true,
  })
  bank_branch?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'BOPHPHMM',
    description: 'SWIFT code',
    nullable: true,
  })
  swift_code?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '+639123456789',
    description: 'Mobile number (for e-wallets)',
    nullable: true,
  })
  mobile_number?: string | null;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether this is the default payout account',
    default: false,
  })
  is_default: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether this account is verified',
    default: false,
  })
  is_verified: boolean;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'When account was verified',
    nullable: true,
  })
  verified_at?: Date | null;

  @ApiProperty({
    type: String,
    example: 'active',
    description: 'Account status',
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  status: string;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this account',
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'Creation timestamp',
  })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who last updated this account',
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:05:00Z',
    description: 'Last update timestamp',
  })
  updated_at: Date;

  @Exclude()
  __entity?: string;
}
