import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class AuthResetPasswordDto {
  @ApiProperty({ example: 'newPassword123!' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'newPassword123!' })
  @IsNotEmpty()
  @MinLength(6)
  passwordConfirmation: string;

  @ApiProperty()
  @IsNotEmpty()
  hash: string;
}
