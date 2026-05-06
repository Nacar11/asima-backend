import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';

export class AuthRequestEmailChangeDto {
  @ApiProperty({
    example: 'new.email@example.com',
    type: String,
    description: 'The new email address to change to',
  })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;
}
