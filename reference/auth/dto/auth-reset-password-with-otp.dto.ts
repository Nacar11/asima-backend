import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';

export class AuthResetPasswordWithOtpDto {
  @ApiProperty({ example: 'john.doe@cody.inc', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', type: String })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;

  @ApiProperty({ example: 'newPassword123!', type: String })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'newPassword123!', type: String })
  @IsNotEmpty()
  @MinLength(6)
  passwordConfirmation: string;
}
