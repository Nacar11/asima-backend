import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';

export class NotifyGuestBookingPaymentDto {
  @ApiProperty({ type: String, example: 'guest@example.com' })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @Length(1, 100)
  email: string;

  @ApiPropertyOptional({
    type: String,
    example: 'GCASH-REF-123456',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  payment_reference?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description:
      'Payment proof screenshot/receipt image. Required for first payment notification.',
  })
  @IsOptional()
  payment_proof?: any;
}
