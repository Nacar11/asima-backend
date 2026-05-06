import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { Bank } from '@/banks/domain/bank';

/**
 * Bank account status enum
 */
export enum BankAccountStatusEnum {
  ACTIVE = 'active',
  VERIFIED = 'verified',
  UNVERIFIED = 'unverified',
}

/**
 * Bank account type enum
 */
export enum BankAccountTypeEnum {
  SAVINGS = 'Savings',
  CHECKING = 'Checking',
}

/**
 * Bank Account domain entity
 */
export class BankAccount {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'User ID who owns this bank account',
  })
  user_id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Bank ID from banks master table',
  })
  bank_id: number;

  @ApiPropertyOptional({
    type: () => Bank,
    description: 'Bank details',
  })
  bank?: Bank;

  @ApiProperty({
    type: String,
    example: 'Juan Dela Cruz',
    description: 'Account holder full name',
  })
  account_holder_name: string;

  @ApiProperty({
    type: String,
    example: '8904',
    description: 'Last 4 digits of account number',
  })
  last_four: string;

  @ApiPropertyOptional({
    enum: BankAccountTypeEnum,
    example: BankAccountTypeEnum.SAVINGS,
    nullable: true,
    description: 'Account type: Savings or Checking',
  })
  account_type?: BankAccountTypeEnum | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether this is the default bank account',
  })
  is_default: boolean;

  @ApiProperty({
    enum: BankAccountStatusEnum,
    example: BankAccountStatusEnum.UNVERIFIED,
    description: 'Bank account verification status',
  })
  status: BankAccountStatusEnum;

  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    description: 'When the bank account was verified',
    example: null,
  })
  verified_at?: Date | null;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
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
