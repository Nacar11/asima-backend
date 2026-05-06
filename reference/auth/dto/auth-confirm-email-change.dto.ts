import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class AuthConfirmEmailChangeDto {
  @ApiProperty({
    example: '123456',
    type: String,
    description: 'The 6-digit OTP code sent to the new email',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only numeric digits' })
  otp: string;
}
