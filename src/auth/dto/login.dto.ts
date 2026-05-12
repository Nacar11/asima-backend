import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@asima.inc' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Asima@1234' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
