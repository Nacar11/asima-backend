import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';

export class AuthVerifyOtpDto {
  @ApiProperty({ example: 'john.doe@cody.inc', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', type: String })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;
}
