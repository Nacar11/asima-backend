import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, Length } from 'class-validator';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';

export class AbandonGuestBookingPaymentDto {
  @ApiProperty({ type: String, example: 'guest@example.com' })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @Length(1, 100)
  email: string;
}
