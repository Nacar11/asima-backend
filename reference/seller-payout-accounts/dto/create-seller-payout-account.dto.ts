import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsIn,
} from 'class-validator';
import { PayoutAccountTypeEnum } from '../enums/payout-account-type.enum';

/**
 * DTO for creating a seller payout account.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateSellerPayoutAccountDto {
  @ApiProperty({
    description: 'Seller ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  seller_id: number;

  @ApiProperty({
    description: 'Account type',
    example: PayoutAccountTypeEnum.BANK_TRANSFER,
    enum: PayoutAccountTypeEnum,
  })
  @IsEnum(PayoutAccountTypeEnum)
  account_type: PayoutAccountTypeEnum;

  @ApiProperty({
    description: 'Account name',
    example: 'John Doe',
  })
  @IsString()
  account_name: string;

  @ApiProperty({
    description: 'Account number',
    example: '1234567890',
  })
  @IsString()
  account_number: string;

  @ApiPropertyOptional({
    description: 'Bank name (for bank accounts)',
    example: 'Bank of the Philippines',
  })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiPropertyOptional({
    description: 'Bank code',
    example: 'BOP',
  })
  @IsOptional()
  @IsString()
  bank_code?: string;

  @ApiPropertyOptional({
    description: 'Bank branch',
    example: 'Makati Branch',
  })
  @IsOptional()
  @IsString()
  bank_branch?: string;

  @ApiPropertyOptional({
    description: 'SWIFT code',
    example: 'BOPHPHMM',
  })
  @IsOptional()
  @IsString()
  swift_code?: string;

  @ApiPropertyOptional({
    description: 'Mobile number (for e-wallets)',
    example: '+639123456789',
  })
  @IsOptional()
  @IsString()
  mobile_number?: string;

  @ApiPropertyOptional({
    description: 'Whether this is the default payout account',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({
    description: 'Account status',
    example: 'active',
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: string;
}
