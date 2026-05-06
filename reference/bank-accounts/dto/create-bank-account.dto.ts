import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BankAccountTypeEnum } from '@/bank-accounts/domain/bank-account';

/**
 * DTO for creating a bank account
 */
export class CreateBankAccountDto {
  @ApiProperty({
    type: String,
    example: 'Juan Dela Cruz',
    description: 'Account holder full name',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  account_holder_name: string;

  @ApiProperty({
    type: String,
    example: '1234567890',
    description: 'Bank account number (will be encrypted)',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  account_number: string;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Bank ID from banks master table',
  })
  @IsNotEmpty()
  @IsInt()
  bank_id: number;

  @ApiPropertyOptional({
    enum: BankAccountTypeEnum,
    example: BankAccountTypeEnum.SAVINGS,
    description: 'Account type: Savings or Checking',
  })
  @IsOptional()
  @IsEnum(BankAccountTypeEnum)
  account_type?: BankAccountTypeEnum;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Set as default bank account',
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
