import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BankAccountTypeEnum } from '@/bank-accounts/domain/bank-account';

/**
 * DTO for updating a bank account
 */
export class UpdateBankAccountDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Juan Dela Cruz',
    description: 'Account holder full name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  account_holder_name?: string;

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
    example: true,
    description: 'Set as default bank account',
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
