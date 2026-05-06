import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';

export enum AccountType {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SELLER = 'seller',
}

export enum DeletionReason {
  NO_LONGER_NEEDED = 'no_longer_needed',
  PRIVACY_CONCERNS = 'privacy_concerns',
  TOO_MANY_NOTIFICATIONS = 'too_many_notifications',
  FOUND_ALTERNATIVE = 'found_alternative',
  SECURITY_CONCERNS = 'security_concerns',
  OTHER = 'other',
}

export class SubmitDeletionRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email must be less than 255 characters' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
  otp: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must be less than 255 characters' })
  full_name: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @ValidateIf((o) => o.phone_number !== '' && o.phone_number !== null)
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please enter a valid phone number',
  })
  @MaxLength(50)
  phone_number?: string;

  @ApiProperty({
    enum: AccountType,
    example: AccountType.CUSTOMER,
  })
  @IsEnum(AccountType, { message: 'Please select a valid account type' })
  @IsNotEmpty({ message: 'Account type is required' })
  account_type: AccountType;

  @ApiProperty({
    enum: DeletionReason,
    example: DeletionReason.NO_LONGER_NEEDED,
  })
  @IsEnum(DeletionReason, { message: 'Please select a valid reason' })
  @IsNotEmpty({ message: 'Reason is required' })
  reason: DeletionReason;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Comments must be less than 1000 characters' })
  additional_comments?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty({ message: 'Confirmation is required' })
  confirmation: boolean;
}
