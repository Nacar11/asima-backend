import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';

export class AuthEmailLoginDto {
  @ApiProperty({ example: 'admin@cody.inc', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password', type: String })
  @IsNotEmpty()
  password: string;
}
